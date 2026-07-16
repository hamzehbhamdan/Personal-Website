// lib/dashboard/people/state.ts
import { daysBetween } from "./text";
import { contactEmails } from "./interactions";
import { tierCad } from "./tiers";
import type { Contact, GmailMap, CalMap, ContactState, CrmDB } from "./types";

export function state(c: Contact, gmail: GmailMap, cal: CalMap, db: Pick<CrmDB, "tiers">, now: Date): ContactState {
  const emails = contactEmails(c);
  let gLast: string | null = null, gDir: "in" | "out" | null = null;
  emails.forEach((e) => { const g = gmail[e]; if (g && (!gLast || (g.last && g.last > gLast))) { gLast = g.last; gDir = g.lastDir; } });
  let calLast: string | null = null, calNext: string | null = null;
  emails.forEach((e) => { const cc = cal[e]; if (cc) { if (cc.lastPast && (!calLast || cc.lastPast > calLast)) calLast = cc.lastPast; if (cc.next && (!calNext || cc.next < calNext)) calNext = cc.next; } });
  const logLast = (c.log || []).reduce<string | null>((m, e) => (!m || e.date > m ? e.date : m), null);
  const cands = [gLast, calLast, c.lastTouch, logLast].filter(Boolean) as string[];
  const last = cands.length ? cands.slice().sort().slice(-1)[0] : null;
  const days = last ? daysBetween(now, new Date(last)) : null;
  const cad = c.cadenceDays || tierCad(db, c.tier) || 90;
  const snoozed = !!(c.snoozeUntil && new Date(c.snoozeUntil) > now);
  const overdue = !snoozed && (days == null || days > cad);
  const soon = !overdue && days != null && days > cad * 0.75;
  const oweReply = gDir === "in" && !!gLast && daysBetween(now, new Date(gLast)) <= 45 && (!calLast || calLast < gLast);
  let bdayIn: number | null = null;
  if (c.birthday && /^\d{2}-\d{2}$/.test(c.birthday)) {
    const [mm, dd] = c.birthday.split("-").map(Number);
    let b = new Date(now.getFullYear(), mm - 1, dd);
    if (b < new Date(now.getFullYear(), now.getMonth(), now.getDate())) b = new Date(now.getFullYear() + 1, mm - 1, dd);
    bdayIn = daysBetween(b, now);
  }
  return { last, days, cad, overdue, soon, snoozed, oweReply, calNext, bdayIn };
}
