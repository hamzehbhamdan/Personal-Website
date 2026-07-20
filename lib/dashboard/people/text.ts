export const MY_EMAILS = ["hamdanhamzeh0@gmail.com", "hamzehhamdan@college.harvard.edu"];
export const lc = (s: unknown) => String(s ?? "").toLowerCase().trim();
export const isMine = (e: unknown) => MY_EMAILS.includes(lc(e));
export const daysBetween = (a: Date, b: Date) => Math.floor((a.getTime() - b.getTime()) / 86400000);
export const fmtDate = (d: string | number | Date | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }) : "—";
export function titleCase(s: string) {
  return s.replace(/[._-]+/g, " ").split(" ").filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
export const nameFromEmail = (e: string) => titleCase(lc(e).split("@")[0]);
export const initials = (name?: string) =>
  (name || "?").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";

/**
 * Epoch ms for the three real timestamp formats that meet in the People views (review #37):
 * gmail UTC ISO ("...Z", lib/gmail.ts toISOString), calendar RFC3339 with the event's offset
 * ("2026-07-18T18:00:00-05:00", app/api/calendar/events passes e.start.dateTime raw), and
 * all-day calendar dates ("YYYY-MM-DD", treated as LOCAL midnight — new Date("YYYY-MM-DD")
 * would parse it as UTC midnight and mis-order it against local-offset events).
 * NEVER compare these strings lexicographically; compare toEpochMs() values and keep the
 * ORIGINAL string in any output. Invalid input yields NaN (all comparisons false), matching
 * the old garbage-in behavior.
 */
export function toEpochMs(s: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime();
  return new Date(s).getTime();
}
