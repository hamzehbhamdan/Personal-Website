import { lc, isMine, fmtDate } from "./text";
import { isPerson } from "./isPerson";
import type { GmailMap, CalMap, GmailHeaderRow, CalendarEvent, Contact, Interaction, GmailMsg } from "./types";

export const LOG_ICON: Record<string, string> = { "Call": "📞", "Text / message": "💬", "In person": "🤝", "Email": "✉️", "Video call": "📹", "Other": "📝" };
export const contactEmails = (c: Contact) => (c.emails || []).map(lc);

function addMsg(map: GmailMap, email: string, msg: GmailMsg) {
  const e = lc(email); if (!isPerson(e)) return;
  const g = map[e] || (map[e] = { last: null, lastDir: null, count: 0, msgs: [] });
  g.count++; g.msgs.push(msg);
  if (!g.last || msg.date > g.last) { g.last = msg.date; g.lastDir = msg.dir; }
}

/** Port of ingestThreads (crm.html:274), snippet DROPPED. `now` filters future-dated rows. */
export function buildGmailMap(rows: GmailHeaderRow[], now: Date): GmailMap {
  const map: GmailMap = {};
  rows.forEach((m) => {
    const d = m.date; if (!d || new Date(d) > now) return;
    const sender = lc(m.from); const tos = (m.to || []).map(lc);
    if (isMine(sender)) tos.forEach((o) => addMsg(map, o, { date: d, dir: "out", subject: m.subject || "" }));
    else addMsg(map, sender, { date: d, dir: "in", subject: m.subject || "" });
  });
  return map;
}

/** Port of ingestEvents (crm.html:275). */
export function buildCalMap(events: CalendarEvent[], now: Date): CalMap {
  const map: CalMap = {};
  events.forEach((ev) => {
    const start = ev.start; if (!start) return;
    const when = new Date(start); const summary = ev.summary || "(busy)";
    (ev.attendees || []).forEach((a) => {
      const e = lc(a.email); if (a.self || isMine(e) || !isPerson(e)) return;
      const c = map[e] || (map[e] = { lastPast: null, next: null, events: [] });
      c.events.push({ date: start, summary });
      if (when <= now) { if (!c.lastPast || start > c.lastPast) c.lastPast = start; }
      else { if (!c.next || start < c.next) c.next = start; }
    });
  });
  return map;
}

/** Port of interactionsFor (crm.html:290): merge email+event+log, newest-first. */
export function interactionsFor(c: Contact, gmail: GmailMap, cal: CalMap): Interaction[] {
  const out: Interaction[] = [];
  contactEmails(c).forEach((e) => {
    (gmail[e]?.msgs ?? []).forEach((m) => out.push({ type: "email", date: m.date, dir: m.dir, text: m.subject || "email" }));
    (cal[e]?.events ?? []).forEach((ev) => out.push({ type: "event", date: ev.date, text: ev.summary }));
  });
  (c.log || []).forEach((l) => out.push({ type: "log", date: l.date, logType: l.type, text: l.note ? `${l.type} — ${l.note}` : l.type }));
  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}
export const tlIcon = (m: Interaction) =>
  m.type === "event" ? "📅" : m.type === "log" ? (LOG_ICON[m.logType || ""] || "📝") : m.dir === "out" ? "➡️" : "⬅️";

/**
 * Port of the check-in "recent interactions" formatter (crm.html:415).
 * Produces human-readable lines that embed UNTRUSTED email subjects / event titles;
 * the caller wraps the returned array in delimiters (buildCheckinPrompt).
 */
export function formatRecent(interactions: Interaction[], limit = 6): string[] {
  return interactions.slice(0, limit).map((m) => {
    const d = fmtDate(m.date);
    if (m.type === "email") return `${d} ${m.dir === "out" ? "I wrote" : "they wrote"}: ${m.text}`;
    if (m.type === "event") return `${d} met: ${m.text}`;
    return `${d} ${m.text}`;
  });
}
