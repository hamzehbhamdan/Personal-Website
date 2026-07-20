"use client";
import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Card } from "@/components/dashboard/ui";
import { AiMarkdown } from "@/components/dashboard/people/AiMarkdown";
import { askAi } from "@/lib/dashboard/people/client-ai";
import { computeOpenBlocks, fmtBlock } from "@/lib/dashboard/home/plan";
import { buildPlanDayPrompt, PLAN_DAY_SYSTEM } from "@/lib/dashboard/home/ai-prompts";
import { btnPrimary, mono, serif } from "./styles";
import type { Goal } from "@/lib/dashboard/coach/types";

interface Ev {
  summary: string;
  start?: string;
  end?: string;
}

/** The centerpiece: suggests which goals to slot into today's OPEN calendar time. Text-only — never writes events. */
export function PlanMyDayBriefing({ goals, intentions }: { goals: Goal[]; intentions: string[] }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [plan, setPlan] = useState("");
  const nothing = goals.length === 0 && intentions.length === 0;

  const run = async () => {
    // Fresh timestamp at CLICK time (finding #25) — the Hero clock ticks live, so a
    // mount-time snapshot here silently planned hours that had already passed.
    const now = new Date();
    setStatus("loading");
    try {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
      const res = await fetch(`/api/calendar/events?timeMin=${start}&timeMax=${end}`)
        .then((r) => r.json())
        .catch(() => ({ events: [] }));
      const events: Ev[] = Array.isArray(res.events) ? res.events : [];
      const blocks = computeOpenBlocks(events, now);
      const prompt = buildPlanDayPrompt({
        today: now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
        nowLabel: now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
        openBlocks: blocks.map((b) => ({ label: fmtBlock(b), mins: b.mins })),
        events: events
          .filter((e) => e.start?.includes("T"))
          .map((e) => ({
            start: new Date(e.start!).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
            summary: e.summary,
          })),
        goals: goals.map((g) => ({ title: g.title, horizon: g.horizon })),
        intentions,
      });
      const out = await askAi("plan_day", prompt, { system: PLAN_DAY_SYSTEM });
      setPlan(out);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  return (
    <Card className="h-full p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-medium text-stone-900" style={serif}>
            Plan my day
          </h3>
          <p className="mt-0.5 text-[12px] text-stone-400">Fit your goals into today&apos;s open time.</p>
        </div>
        {!nothing && (
          <button type="button" onClick={run} disabled={status === "loading"} className={btnPrimary} style={mono}>
            {status === "loading" ? <Loader2 className="mr-1 inline size-3 animate-spin" /> : <Sparkles className="mr-1 inline size-3" />}
            {status === "done" ? "Re-plan" : "Plan my day"}
          </button>
        )}
      </div>
      <div className="mt-4">
        {nothing ? (
          <p className="text-[13px] text-stone-400">Add goals in Coach or set an intention, then I&apos;ll suggest a schedule.</p>
        ) : status === "idle" ? (
          <p className="text-[13px] text-stone-400">I&apos;ll look at your open calendar time and suggest what to work on.</p>
        ) : status === "loading" ? (
          <p className="text-[13px] text-stone-400">Reading your calendar and goals…</p>
        ) : status === "error" ? (
          <p className="text-[13px] text-[#A51C30]">Couldn&apos;t build a plan right now. Please try again.</p>
        ) : (
          <AiMarkdown text={plan} />
        )}
      </div>
    </Card>
  );
}
