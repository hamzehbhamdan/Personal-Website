// components/dashboard/coach/IntakeModal.tsx
//
// Ports coach.html:682-732 (`openIntake` / `aiRespond` / `sendIntake` /
// `renderProposed` / `addProposed` / `finishIntake`) — the guided, top-down
// goal-setting chat. Opened with the `horizons` the caller wants set (from the
// intake banner or a higher-horizon empty state, both of which already call
// `setOverlay({kind:'intake', horizons})`); this component only owns the modal
// itself. Task 23 mounts it in CoachView's overlay switch.
//
// Every write goes through `mutate`, which re-derives a migrated draft from
// `prev` (never from the `db` snapshot prop) per the STATE-MUTATION CONVENTION.
// All AI-authored (and AI-fallback) text renders ONLY via <AiMarkdown/> — never
// dangerouslySetInnerHTML.
"use client";
import { useEffect, useRef, useState } from "react";
import type { CoachDB, Horizon } from "@/lib/dashboard/coach/types";
import type { Mutate } from "./overlay";
import { periodRange } from "@/lib/dashboard/coach/periods";
import { askAi } from "@/lib/dashboard/coach/ai";
import { intakeSystemPrompt, intakeTurnPrompt, addProposedGoals, isFirstRun } from "@/lib/dashboard/coach/intake";
import { parseGoalsBlock, type ProposedGoal } from "@/lib/dashboard/coach/parse";
import { Modal, Badge } from "@/components/dashboard/ui";
import { AiMarkdown } from "@/components/dashboard/people/AiMarkdown";

const mono = { fontFamily: "var(--font-geist-mono), monospace" };
const btnPrimary =
  "rounded-[8px] bg-[#A51C30] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white hover:bg-[#8a1728] disabled:opacity-50";
const btnCrimsonOutline =
  "rounded-[8px] border border-[#A51C30] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[#A51C30] hover:bg-[#A51C30] hover:text-white disabled:opacity-50";
const inputCls =
  "w-full rounded-[8px] border border-stone-200 bg-white px-2.5 py-2 text-[13px] text-stone-800 outline-none focus:border-[#A51C30]";

// coach.html:706 — shown when /api/ai comes back null (rate-limited, no key,
// network error, etc). Deliberately does not mention "Cowork" — this runs as a
// normal Next.js route now, not the artifact's Cowork runtime.
const FALLBACK_TEXT = "The coach needs to be connected — you can add goals manually.";

interface ConvoMsg {
  role: "me" | "ai";
  text: string;
  fallback?: boolean;
}

export function IntakeModal({
  db,
  mutate,
  today,
  horizons,
  onClose,
}: {
  db: CoachDB;
  mutate: Mutate;
  today: Date;
  horizons: Horizon[];
  onClose: () => void;
}) {
  const [convo, setConvo] = useState<ConvoMsg[]>([]);
  const [proposed, setProposed] = useState<ProposedGoal[]>([]);
  const [checked, setChecked] = useState<boolean[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [finishing, setFinishing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const kicked = useRef(false);

  const firstRun = isFirstRun(db);
  const periodsLabel = horizons.map((h) => periodRange(h, 0, today).label).join(" · ");

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [convo, typing]);

  // Same context payload on every turn (coach.html:702-703's `intakeTurn`), built
  // fresh from the current `db` prop each call so a mid-chat "Add selected goals"
  // is reflected in `existing_goals` on the following turn.
  function intakeData() {
    return {
      what_matters: db.matters,
      memory: db.memory,
      existing_goals: db.goals.map((g) => ({ horizon: g.horizon, title: g.title })),
      target_periods: horizons,
    };
  }

  // Shared kick/turn responder (coach.html:687 `aiRespond`). Only replaces
  // `proposed` when the reply actually contains a fresh ```goals block — a
  // follow-up turn that doesn't re-propose leaves the still-unactioned
  // checklist from the prior turn on screen (coach.html:686 `handleAssistant`
  // only reassigns `proposed` inside its regex match branch).
  async function respond(transcript: string, kick: boolean) {
    setTyping(true);
    const reply = await askAi(
      "intake",
      intakeTurnPrompt(transcript, kick),
      intakeData(),
      intakeSystemPrompt(db, horizons, today)
    );
    setTyping(false);
    if (reply == null) {
      setConvo((c) => [...c, { role: "ai", text: FALLBACK_TEXT, fallback: true }]);
      return;
    }
    const parsed = parseGoalsBlock(reply);
    if (parsed.goals.length) {
      setProposed(parsed.goals);
      setChecked(parsed.goals.map(() => true));
    }
    setConvo((c) => [...c, { role: "ai", text: parsed.text }]);
  }

  // Kick on open — guarded so it fires exactly once even under
  // StrictMode's dev double-invoke of mount effects.
  useEffect(() => {
    if (kicked.current) return;
    kicked.current = true;
    void respond("", true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function transcriptOf(msgs: ConvoMsg[]): string {
    return msgs.map((m) => (m.role === "me" ? "Me: " : "Coach: ") + m.text).join("\n");
  }

  function handleSend() {
    const v = input.trim();
    if (!v || typing) return;
    setInput("");
    const next = [...convo, { role: "me" as const, text: v }];
    setConvo(next);
    void respond(transcriptOf(next), false);
  }

  function toggle(i: number) {
    setChecked((c) => c.map((v, idx) => (idx === i ? !v : v)));
  }

  function handleAddSelected() {
    const picks = proposed.filter((_, i) => checked[i]);
    if (!picks.length) return;
    mutate((draft) => addProposedGoals(draft, picks, horizons, today));
    setProposed([]);
    setChecked([]);
    setConvo((c) => [...c, { role: "ai", text: "Added those to your goals. Keep refining here, or finish to save what I learned." }]);
  }

  // Finish & save to memory (coach.html:706-712). Non-trivial = more than just
  // the opening kick message, mirroring `convo.length>1`. `matters` is only ever
  // derived when empty; `intakeDone` is always marked for every OPENED horizon,
  // whether or not any goals were actually added, so the banner stops nagging.
  async function handleFinish() {
    if (finishing) return;
    setFinishing(true);
    let newMatters: string | null = null;
    let memNote: string | null = null;
    if (convo.length > 1) {
      const transcript = transcriptOf(convo);
      if (!db.matters) {
        newMatters = await askAi(
          "intake",
          "Summarize what matters to Hamzeh in 2-3 sentences based on the conversation — priorities, values, what success looks like, boundaries. Return ONLY the note.",
          { transcript }
        );
      }
      memNote = await askAi(
        "intake",
        'Write 1-3 short bullet notes to remember about Hamzeh for future goal-setting, based on the conversation. Return ONLY bullets starting with "- ".',
        { transcript, what_matters: newMatters ?? db.matters ?? "" }
      );
    }
    mutate((draft) => {
      if (newMatters) draft.matters = newMatters.trim();
      if (memNote) {
        const date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
        draft.memory = (draft.memory ? draft.memory + "\n\n" : "") + "### " + date + " intake\n" + memNote.trim();
      }
      horizons.forEach((h) => {
        draft.intakeDone[h + ":" + periodRange(h, 0, today).key] = true;
      });
    });
    setFinishing(false);
    onClose();
  }

  return (
    <Modal title={firstRun ? "✦ Welcome — let’s set you up" : "✦ Goal intake"} onClose={onClose} size="wide">
      <div className="mb-3 text-[12.5px] leading-[1.6] text-stone-500">
        {firstRun ? "A first chat to capture what matters to you and set your goals for " : "A guided chat to set your goals for "}
        <strong className="font-semibold text-stone-900">{periodsLabel}</strong>, top-down so they ladder together.
      </div>

      <div ref={scrollRef} className="mb-2.5 flex max-h-[320px] flex-col gap-2.5 overflow-auto px-0.5 py-1">
        {convo.map((m, i) =>
          m.role === "me" ? (
            // [&_p]:text-white overrides AiMarkdown's hardcoded text-stone-700 on its
            // wrapping <p> (a directly-specified rule on the descendant always beats
            // an inherited color, no !important needed) so the bubble stays legible
            // on the crimson fill.
            <div key={i} className="self-end max-w-[88%] rounded-[13px] rounded-br-[4px] bg-[#A51C30] px-3 py-2.5 [&_p]:text-white">
              <AiMarkdown text={m.text} />
            </div>
          ) : (
            <div
              key={i}
              className={`self-start max-w-[88%] rounded-[13px] rounded-bl-[4px] border px-3 py-2.5 ${
                m.fallback ? "border-[#A51C30]/40 bg-[#faf0f1]" : "border-stone-200 bg-[#f9f8f6]"
              }`}
            >
              <AiMarkdown text={m.text} />
            </div>
          )
        )}
        {typing && <div className="self-start text-[13px] text-stone-500">thinking…</div>}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder="Type your reply…"
          disabled={typing}
          className={inputCls}
        />
        <button type="button" onClick={handleSend} disabled={!input.trim() || typing} className={btnPrimary} style={mono}>
          Send
        </button>
      </div>

      {proposed.length > 0 && (
        <div className="mt-3.5 rounded-[11px] border border-stone-200 bg-stone-50 p-3">
          <div className="mb-2 text-[12.5px] text-stone-500">Proposed goals — uncheck any you don’t want, then add:</div>
          {proposed.map((g, i) => (
            <label key={i} className="flex items-center gap-2.5 border-b border-stone-200 py-1.5 text-[13px] text-stone-800 last:border-b-0">
              <input type="checkbox" checked={checked[i] ?? true} onChange={() => toggle(i)} />
              <span className="flex-1">{g.title}</span>
              <Badge tone="neutral">{g.horizon}</Badge>
              {g.laddersTo && g.laddersTo !== "null" && (
                <span className="text-[11.5px] text-stone-400">↳ {g.laddersTo}</span>
              )}
            </label>
          ))}
          <div className="mt-2.5">
            <button
              type="button"
              onClick={handleAddSelected}
              disabled={!checked.some(Boolean)}
              className={btnCrimsonOutline}
              style={mono}
            >
              + Add selected goals
            </button>
          </div>
        </div>
      )}

      <div className="mt-4">
        <button type="button" onClick={handleFinish} disabled={finishing} className={btnPrimary} style={mono}>
          {finishing ? "Saving…" : "Finish & save to memory"}
        </button>
      </div>
    </Modal>
  );
}
