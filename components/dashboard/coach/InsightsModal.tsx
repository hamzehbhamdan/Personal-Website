// components/dashboard/coach/InsightsModal.tsx
//
// Ports coach.html:773-836 (`openInsights` / `renderInsights`) — the analytics
// dashboard reachable from the "Insights" header pill (CoachView, Task 14; that
// pill's onClick still TODOs to Task 23, which will wire it to open this modal).
// Read-only: this component never calls `mutate` and takes no `db` write path —
// it only derives `computeInsights(db, scope, today)` and renders it.
//
// The artifact's 6-color goal-bar palette (coach.html:792,
// `['#6d7740','#8a9553','#bf6129','#c9a04a','#3f6070','#a9772f']`) is dropped
// per the brief in favor of crimson for the largest (first, since `rows` is
// sorted desc by ms) row and stone for the rest — no olive/amber/blue.
"use client";
import { useState } from "react";
import type { CoachDB } from "@/lib/dashboard/coach/types";
import { computeInsights, type InsScope } from "@/lib/dashboard/coach/insights";
import { fmtHM } from "@/lib/dashboard/coach/timers";
import { Modal, Card, Segmented } from "@/components/dashboard/ui";

const serif = { fontFamily: "var(--font-playfair), Georgia, serif" };
const mono = { fontFamily: "var(--font-geist-mono), monospace" };

const SCOPES: { value: InsScope; label: string }[] = [
  { value: "week", label: "This week" },
  { value: "month", label: "Month" },
  { value: "quarter", label: "Quarter" },
  { value: "year", label: "Year" },
  { value: "all", label: "All time" },
];

// coach.html:70 `.htag.<horizon>` tints, collapsed to the crimson/stone palette.
const HORIZON_TAG_CLS: Record<string, string> = {
  year: "bg-[#faf0f1] text-[#A51C30]",
  quarter: "bg-[#f0eeea] text-stone-600",
  month: "bg-[#f0eeea] text-stone-500",
  week: "bg-[#f0eeea] text-stone-500",
};

function MCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="px-[11px] py-[9px]">
      <div className="text-[10.5px] text-stone-400" style={mono}>{label}</div>
      <div className="text-[20px] font-semibold text-stone-900" style={serif}>{value}</div>
    </Card>
  );
}

// coach.html:174-178 `.tbar` — fixed-width name + flex-fill track + fixed-width value.
function TBar({ name, pct, value, fill }: { name: string; pct: number; value: string; fill: string }) {
  return (
    <div className="mb-[7px] flex items-center gap-[9px] text-[12px]">
      <span className="w-[130px] flex-none overflow-hidden text-ellipsis whitespace-nowrap text-stone-600">{name}</span>
      <span className="h-[13px] flex-1 overflow-hidden rounded-[7px] bg-[#f0eeea]">
        <span className="block h-full" style={{ width: `${pct}%`, background: fill }} />
      </span>
      <span className="w-[56px] flex-none text-right text-stone-400">{value}</span>
    </div>
  );
}

export function InsightsModal({ db, today, onClose }: { db: CoachDB; today: Date; onClose: () => void }) {
  const [scope, setScope] = useState<InsScope>("week");
  const ins = computeInsights(db, scope, today);

  const maxMs = Math.max(1, ...ins.rows.map((r) => r.ms));
  const maxN = Math.max(1, ...ins.rows.map((r) => r.n));

  // coach.html:801 — 8 evenly-spaced points across pathW, inset 8px each side;
  // y runs from pathH-8 (min) up to 8 (max), i.e. 1 - v/maxCum of the plot height.
  const pathW = 300, pathH = 70;
  const points = ins.cumPts
    .map((v, i) => `${8 + (i * (pathW - 16)) / (ins.cumPts.length - 1)},${8 + (pathH - 8) * (1 - v / ins.maxCum)}`)
    .join(" ");

  const needParent = ins.need && ins.need.k !== "__un" ? db.goals.find((g) => g.id === ins.need!.k)?.parentId : undefined;
  const needParentGoal = needParent ? db.goals.find((g) => g.id === needParent) : undefined;
  const needOpenN = ins.need ? ins.need.n - ins.need.done : 0;

  return (
    <Modal title="Insights" onClose={onClose} size="wide">
      <div className="mb-3.5">
        <Segmented options={SCOPES} value={scope} onChange={setScope} />
      </div>

      <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] gap-[9px]">
        <MCard label="Time tracked" value={fmtHM(ins.totalMs)} />
        <MCard label="Tasks done" value={`${ins.doneN} / ${ins.taskN}`} />
        <MCard label="Points cleared" value={`${ins.donePts} / ${ins.pts}`} />
        <MCard label="Min / point" value={ins.minPerPt ? String(ins.minPerPt) : "—"} />
      </div>

      <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.05em] text-stone-400">Time by goal</div>
      {ins.rows.length ? (
        ins.rows.map((r, i) => (
          <TBar
            key={r.k}
            name={r.name}
            pct={Math.round((r.ms / maxMs) * 100)}
            value={fmtHM(r.ms)}
            fill={i === 0 ? "#A51C30" : "#a8a29e"}
          />
        ))
      ) : (
        <div className="text-[12.5px] text-stone-400">No time tracked in this range yet.</div>
      )}

      <div className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-[0.05em] text-stone-400">Tasks by goal</div>
      {ins.rows.length > 0 &&
        ins.rows.map((r) => (
          <TBar key={r.k} name={r.name} pct={Math.round((r.n / maxN) * 100)} value={`${r.done}/${r.n}`} fill="#78716c" />
        ))}

      {ins.need && (
        <Card className="mb-4 mt-4 flex items-start gap-[10px] border-[#e8cfa9] bg-[#faf0f1] px-[12px] py-[10px] text-[12px] leading-[1.5] text-stone-600">
          <span className="text-[15px] text-[#A51C30]">⚠</span>
          <div>
            <b className="text-stone-900">{ins.need.name} is getting the least time.</b>{" "}
            {fmtHM(ins.need.ms)} across {needOpenN} open task{needOpenN === 1 ? "" : "s"}
            {needParentGoal ? `, and it ladders up to ${needParentGoal.title}` : ""}. Consider giving it a block this week.
          </div>
        </Card>
      )}

      <div className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-[0.05em] text-stone-400">
        Points cleared over time (8 weeks)
      </div>
      <div className="rounded-[10px] border border-stone-200 bg-[#f9f8f6] p-3">
        <svg viewBox={`0 0 ${pathW} ${pathH + 16}`} className="h-auto w-full">
          <line x1="8" y1={pathH} x2={pathW - 8} y2={pathH} stroke="#e7e5e4" />
          <polyline points={points} fill="none" stroke="#A51C30" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <text x="8" y={pathH + 13} fontSize="8" fill="#a8a29e" style={mono}>8 wks ago</text>
          <text x={pathW - 40} y={pathH + 13} fontSize="8" fill="#a8a29e" style={mono}>this wk</text>
        </svg>
      </div>

      {ins.proj.length > 0 && (
        <>
          <div className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-[0.05em] text-stone-400">
            Projected finish at current pace
          </div>
          {ins.proj.map((p) => (
            <div key={p.title} className="mb-[7px] flex items-center gap-[9px] text-[12px]">
              <span className="w-[130px] flex-none overflow-hidden text-ellipsis whitespace-nowrap text-stone-600">
                {p.title}{" "}
                <span
                  className={`rounded-[5px] px-[7px] py-[2px] text-[9px] font-bold uppercase tracking-[0.03em] ${HORIZON_TAG_CLS[p.horizon] || "bg-[#f0eeea] text-stone-500"}`}
                >
                  {p.horizon}
                </span>
              </span>
              <span className="h-[13px] flex-1 overflow-hidden rounded-[7px] bg-[#f0eeea]">
                <span className="block h-full" style={{ width: `${p.pct}%`, background: "#A51C30" }} />
              </span>
              <span className="w-[56px] flex-none text-right text-stone-400">{p.wks ? `~${p.wks}wk` : "done"}</span>
            </div>
          ))}
        </>
      )}

      <div className="mt-4 text-[12px] text-stone-400">
        Time by goal counts tracked timer time; projections extrapolate your recent weekly points. The more you track, the sharper these get.
      </div>
    </Modal>
  );
}
