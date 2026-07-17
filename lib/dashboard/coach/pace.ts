export type PaceKind = "on" | "behind" | "done" | "idle" | "none";

export function higherPace(overallPct: number, elapsedPct: number, isCurrent = true, goalCount = 1):
  { kind: PaceKind; text: string } {
  if (!goalCount || !isCurrent) return { kind: "none", text: "" };
  if (overallPct >= 100) return { kind: "done", text: "complete" };
  if (overallPct >= elapsedPct - 12) return { kind: "on", text: "on pace" };
  return { kind: "behind", text: (elapsedPct - overallPct) + "% behind pace" };
}

export function weekPace(m: { isEmpty: boolean; total: number; done: number }):
  { kind: PaceKind; pct: string; text: string } {
  if (m.isEmpty) return { kind: "idle", pct: "", text: "not started" };
  const pct = m.total ? Math.round((m.done / m.total) * 100) : 0;
  return { kind: "on", pct: m.total ? pct + "%" : "—", text: m.total ? m.done + " / " + m.total + " pts" : "" };
}
