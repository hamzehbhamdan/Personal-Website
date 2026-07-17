// components/dashboard/coach/CoachPanel.tsx
//
// Ports coach.html:598-661 (`openCoach` / `renderCoachTabs` / the Chat, What
// matters, and Memory panes / `doCoach`). A `Modal` titled "✦ Coach" with an
// inner `Segmented` for the three tabs.
//
// Chat: suggestion chips prefill the input; asking either matches the
// suggest-goals intent (coach.html:648 `/set .*goal|help me set|suggest goal/i`)
// and renders tap-to-add goal rows via the shared `useSuggestRows` hook (Task 19,
// also used by GoalModal's suggest-tasks), or falls through to free-form
// `coach_chat` and renders the answer through `<AiMarkdown/>` — never raw HTML.
// The coach persona travels as the `system` arg (COACH_CHAT_SYSTEM); the
// question is the `prompt`; `ctx()` is the delimited untrusted `data` (askAi
// embeds it for us, see lib/dashboard/coach/ai.ts).
//
// What matters / Memory: plain textareas bound to `db.matters` / `db.memory`;
// Save writes through `mutate` per the STATE-MUTATION CONVENTION and shows a
// transient "Saved." message.
"use client";
import { useState } from "react";
import type { CoachDB, Horizon } from "@/lib/dashboard/coach/types";
import type { Mutate } from "./overlay";
import { periodRange, NEXTUP } from "@/lib/dashboard/coach/periods";
import { uid } from "@/lib/dashboard/coach/migrate";
import { askAi } from "@/lib/dashboard/coach/ai";
import { ctx, COACH_CHAT_SYSTEM } from "@/lib/dashboard/coach/intake";
import { Modal, Segmented } from "@/components/dashboard/ui";
import { AiMarkdown } from "@/components/dashboard/people/AiMarkdown";
import { useSuggestRows } from "./useSuggestRows";

const mono = { fontFamily: "var(--font-geist-mono), monospace" };
const btnPrimary =
  "rounded-[8px] bg-[#A51C30] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white hover:bg-[#8a1728] disabled:opacity-50";
const btnGhostSmall =
  "rounded-[6px] border border-stone-200 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-500 hover:border-[#A51C30] hover:text-[#A51C30] disabled:opacity-50";
const chipCls =
  "rounded-full border border-stone-200 px-3 py-1 text-[12px] text-stone-600 hover:border-[#A51C30] hover:text-[#A51C30] disabled:opacity-50";
const inputCls =
  "w-full rounded-[8px] border border-stone-200 bg-white px-2.5 py-2 text-[13px] text-stone-800 outline-none focus:border-[#A51C30]";
const textareaCls =
  "w-full min-h-[270px] rounded-[10px] border border-stone-200 bg-[#f9f8f6] p-3 text-[13.5px] leading-[1.6] text-stone-800 outline-none focus:border-[#A51C30]";

type CoachTab = "chat" | "matters" | "memory";

export function CoachPanel({
  db,
  mutate,
  today,
  horizon,
  offset,
  onClose,
}: {
  db: CoachDB;
  mutate: Mutate;
  today: Date;
  horizon: Horizon;
  offset: number;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<CoachTab>("chat");

  return (
    <Modal title="✦ Coach" onClose={onClose}>
      <div className="mb-3.5">
        <Segmented<CoachTab>
          options={[
            { value: "chat", label: "✦ Chat" },
            { value: "matters", label: "What matters" },
            { value: "memory", label: "Memory" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {tab === "chat" && <ChatPane db={db} mutate={mutate} today={today} horizon={horizon} offset={offset} />}
      {tab === "matters" && (
        <NotePane
          note="Your evergreen priorities and values. The coach reads this every time it helps you set goals or plan a week."
          placeholder={"What I care about most right now…\nWho I want to become…\nNon-negotiables…"}
          initial={db.matters || ""}
          onSave={(value) => mutate((draft) => { draft.matters = value; })}
        />
      )}
      {tab === "memory" && (
        <NotePane
          note="What the coach has learned about you from your intakes, so it stays aligned over time. Prune or edit freely."
          placeholder="The coach adds notes here after your intake chats."
          initial={db.memory || ""}
          onSave={(value) => mutate((draft) => { draft.memory = value; })}
        />
      )}
    </Modal>
  );
}

/* ---------- Chat ---------- */

// coach.html:648 — matches "set goals" intent vs. free-form questions.
const SUGGEST_GOALS_RE = /set .*goal|help me set|suggest goal/i;

function ChatPane({
  db,
  mutate,
  today,
  horizon,
  offset,
}: {
  db: CoachDB;
  mutate: Mutate;
  today: Date;
  horizon: Horizon;
  offset: number;
}) {
  const [query, setQuery] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatAnswer, setChatAnswer] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const goalRows = useSuggestRows();

  const busy = chatLoading || goalRows.suggesting;
  const period = periodRange(horizon, offset, today);

  const chips = [
    `Help me set goals for this ${horizon}`,
    "Am I on pace?",
    "Which goal needs more time?",
    "What should I focus on first?",
  ];

  function addGoal(title: string) {
    mutate((draft) => {
      draft.goals.push({
        id: uid("g"),
        horizon,
        period: periodRange(horizon, offset, today).key,
        title,
        parentId: "",
        recurring: false,
        useManual: false,
        manualProgress: 0,
        notes: "",
      });
    });
  }

  async function doCoach(raw: string) {
    const question = raw.trim();
    if (!question || busy) return;

    if (SUGGEST_GOALS_RE.test(question)) {
      setChatAnswer(null);
      setChatError(null);
      const nextUp = NEXTUP[horizon];
      const parents = nextUp ? db.goals.filter((g) => g.horizon === nextUp) : [];
      const prompt = `Suggest 3-5 focused ${horizon} goals for ${period.label}${
        parents.length ? ", laddering up from these higher goals: " + parents.map((p) => p.title).join("; ") : ""
      }. Make them specific and outcome-oriented. Return ONLY a JSON array of short goal strings.`;
      await goalRows.run("suggest_goals", prompt, { horizon, period: period.label, higher_goals: parents.map((p) => p.title) });
      return;
    }

    goalRows.reset();
    setChatError(null);
    setChatAnswer(null);
    setChatLoading(true);
    const text = await askAi("coach_chat", question, ctx(db, { horizon, offset }, today), COACH_CHAT_SYSTEM);
    setChatLoading(false);
    if (text === null) {
      setChatError("The coach is unavailable right now.");
      return;
    }
    setChatAnswer(text);
  }

  return (
    <div>
      <div className="text-[12.5px] leading-[1.6] text-stone-500">
        A quick hand with the work that matters: setting goals and staying on pace. Nothing leaves your browser except what you ask.
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <button
            key={c}
            type="button"
            disabled={busy}
            onClick={() => { setQuery(c); doCoach(c); }}
            className={chipCls}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") doCoach(query); }}
          placeholder="Ask anything about your goals…"
          className={inputCls}
        />
      </div>

      <div className="mt-2.5">
        <button type="button" onClick={() => doCoach(query)} disabled={!query.trim() || busy} className={btnPrimary} style={mono}>
          {busy ? "…" : "Ask"}
        </button>
      </div>

      {goalRows.suggesting && <div className="mt-3 text-[12.5px] text-stone-500">Thinking…</div>}
      {goalRows.error && <div className="mt-3 text-[12.5px] text-[#A51C30]">{goalRows.error}</div>}
      {goalRows.items && goalRows.items.length === 0 && (
        <div className="mt-3 text-[12.5px] text-stone-400">No suggestions.</div>
      )}
      {goalRows.items && goalRows.items.length > 0 && (
        <div className="mt-3 rounded-[11px] border border-stone-200 bg-stone-50 p-3">
          <div className="mb-2 text-[12.5px] text-stone-500">Tap to add for {period.label}:</div>
          {goalRows.items.map((label, i) => (
            <div key={i} className="flex items-center gap-2 border-b border-stone-200 py-1.5 text-[13px] last:border-b-0">
              <span className="flex-1">{label}</span>
              <button
                type="button"
                disabled={goalRows.addedIdx.has(i)}
                onClick={() => goalRows.add(i, addGoal)}
                className={btnGhostSmall}
                style={mono}
              >
                {goalRows.addedIdx.has(i) ? "Added ✓" : "+ Add"}
              </button>
            </div>
          ))}
        </div>
      )}

      {chatLoading && <div className="mt-3 text-[12.5px] text-stone-500">Thinking…</div>}
      {chatError && <div className="mt-3 text-[12.5px] text-[#A51C30]">{chatError}</div>}
      {chatAnswer && (
        <div className="mt-3 rounded-[11px] border border-stone-200 bg-[#f9f8f6] p-3">
          <AiMarkdown text={chatAnswer} />
        </div>
      )}
    </div>
  );
}

/* ---------- What matters / Memory ---------- */

// Shared shape for the two evergreen-note tabs (coach.html:637-646): a note
// explaining what the field is for, a textarea seeded once from the current
// value, and a Save button that mutates + shows a transient "Saved." message.
function NotePane({
  note,
  placeholder,
  initial,
  onSave,
}: {
  note: string;
  placeholder: string;
  initial: string;
  onSave: (value: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const [msg, setMsg] = useState("");

  function handleSave() {
    onSave(value);
    setMsg("Saved.");
    setTimeout(() => setMsg(""), 1500);
  }

  return (
    <div>
      <div className="text-[12.5px] leading-[1.6] text-stone-500">{note}</div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className={`mt-2.5 ${textareaCls}`}
      />
      <div className="mt-2.5 flex items-center gap-2.5">
        <button type="button" onClick={handleSave} className={btnPrimary} style={mono}>
          Save
        </button>
        {msg && <span className="text-[12.5px] text-stone-500">{msg}</span>}
      </div>
    </div>
  );
}
