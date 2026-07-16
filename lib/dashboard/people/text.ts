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
