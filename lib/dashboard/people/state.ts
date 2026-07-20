// lib/dashboard/people/state.ts
import { daysBetween, toEpochMs } from "./text";
import { contactEmails } from "./interactions";
import { tierCad } from "./tiers";
import type { Contact, GmailMap, CalMap, ContactState, CrmDB } from "./types";

export function state(c: Contact, gmail: GmailMap, cal: CalMap, db: Pick<CrmDB, "tiers">, now: Date): ContactState {
  const emails = contactEmails(c);
  let gLast: string | null = null, gDir: "in" | "out" | null = null;
  emails.forEach((e) => { const g = gmail[e]; if (g && (!gLast || (g.last && toEpochMs(g.last) > toEpochMs(gLast)))) { gLast = g.last; gDir = g.lastDir; } });
  let calLast: string | null = null, calNext: string | null = null;
  emails.forEach((e) => { const cc = cal[e]; if (cc) { if (cc.lastPast && (!calLast || toEpochMs(cc.lastPast) > toEpochMs(calLast))) calLast = cc.lastPast; if (cc.next && (!calNext || toEpochMs(cc.next) < toEpochMs(calNext))) calNext = cc.next; } });
  const logLast = (c.log || []).reduce<string | null>((m, e) => (!m || toEpochMs(e.date) > toEpochMs(m) ? e.date : m), null);
  const cands = [gLast, calLast, c.lastTouch, logLast].filter(Boolean) as string[];
  // Max by INSTANT but return the ORIGINAL string (review #37) — callers/tests rely on
  // the source string surviving verbatim (no toISOString re-serialization).
  const last = cands.length ? cands.reduce((m, x) => (toEpochMs(x) > toEpochMs(m) ? x : m)) : null;
  const days = last ? daysBetween(now, new Date(toEpochMs(last))) : null;
  const cad = c.cadenceDays || tierCad(db, c.tier) || 90;
  const snoozed = !!(c.snoozeUntil && new Date(c.snoozeUntil) > now);
  const overdue = !snoozed && (days == null || days > cad);
  const soon = !overdue && days != null && days > cad * 0.75;
  const oweReply = gDir === "in" && !!gLast && daysBetween(now, new Date(gLast)) <= 45 && (!calLast || toEpochMs(calLast) < toEpochMs(gLast));
  let bdayIn: number | null = null;
  if (c.birthday && /^\d{2}-\d{2}$/.test(c.birthday)) {
    const [mm, dd] = c.birthday.split("-").map(Number);
    // Anchor to date-only "today" (local midnight) so the countdown is an exact day count
    // regardless of the time-of-day carried by `now`: 0 = today, 1 = tomorrow (no off-by-one).
    const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let b = new Date(now.getFullYear(), mm - 1, dd);
    if (b < today0) b = new Date(now.getFullYear() + 1, mm - 1, dd);
    bdayIn = daysBetween(b, today0);
  }
  return { last, days, cad, overdue, soon, snoozed, oweReply, calNext, bdayIn };
}
