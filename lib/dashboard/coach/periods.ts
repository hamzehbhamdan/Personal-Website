import type { Goal, Horizon } from "./types";

export const HORIZONS: [Horizon, string][] = [["week", "Week"], ["month", "Month"], ["quarter", "Quarter"], ["year", "Year"]];
export const NEXTDOWN: Record<Horizon, Horizon | null> = { year: "quarter", quarter: "month", month: "week", week: null };
export const NEXTUP: Record<Horizon, Horizon | null> = { week: "month", month: "quarter", quarter: "year", year: null };

export interface PeriodRange { key: string; label: string; start: Date; end: Date; }

export function periodRange(h: Horizon, off = 0, today: Date = new Date()): PeriodRange {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (h === "week") {
    const dow = (d.getDay() + 6) % 7;
    const start = new Date(d); start.setDate(d.getDate() - dow + off * 7);
    const end = new Date(start); end.setDate(start.getDate() + 6);
    return { key: "W" + start.toISOString().slice(0, 10),
      label: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " – " +
             end.toLocaleDateString("en-US", { month: "short", day: "numeric" }), start, end };
  }
  if (h === "month") {
    const start = new Date(d.getFullYear(), d.getMonth() + off, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    return { key: start.getFullYear() + "-" + String(start.getMonth() + 1).padStart(2, "0"),
      label: start.toLocaleDateString("en-US", { month: "long", year: "numeric" }), start, end };
  }
  if (h === "quarter") {
    const start = new Date(d.getFullYear(), (Math.floor(d.getMonth() / 3) + off) * 3, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 3, 0);
    return { key: start.getFullYear() + "-Q" + (Math.floor(start.getMonth() / 3) + 1),
      label: "Q" + (Math.floor(start.getMonth() / 3) + 1) + " " + start.getFullYear(), start, end };
  }
  const start = new Date(d.getFullYear() + off, 0, 1);
  const end = new Date(start.getFullYear(), 11, 31);
  return { key: String(start.getFullYear()), label: String(start.getFullYear()), start, end };
}

export function elapsedFrac(r: PeriodRange, today: Date = new Date()): number {
  const t = today.getTime();
  if (t < r.start.getTime()) return 0;
  if (t > r.end.getTime() + 86400000) return 1;
  return (t - r.start.getTime()) / ((r.end.getTime() + 86400000) - r.start.getTime());
}

export function periodLabelOf(g: Pick<Goal, "period">): string {
  const p = g.period;
  if (/^\d{4}$/.test(p)) return p;
  if (/^\d{4}-Q\d$/.test(p)) return p.slice(5) + " " + p.slice(0, 4);
  if (/^\d{4}-\d{2}$/.test(p)) { const [y, m] = p.split("-"); return new Date(+y, +m - 1).toLocaleDateString("en-US", { month: "short", year: "numeric" }); }
  if (/^W/.test(p)) { const s = new Date(p.slice(1)); const e = new Date(s); e.setDate(s.getDate() + 6);
    return s.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + "–" + e.toLocaleDateString("en-US", { day: "numeric" }); }
  return p || "";
}

export function findOffset(h: Horizon, key: string, today: Date = new Date()): number {
  for (let o = -80; o <= 80; o++) if (periodRange(h, o, today).key === key) return o;
  return 0;
}
