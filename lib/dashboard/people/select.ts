import { lc } from "./text";
import { contactEmails } from "./interactions";
import type { CrmDB, Contact, ContactState, Group } from "./types";

export const getContact = (db: CrmDB, id: string) => db.contacts.find((c) => c.id === id);
export const getGroup = (db: CrmDB, id: string) => db.groups.find((g) => g.id === id);
export function allTags(db: CrmDB) { const s = new Set<string>(); db.contacts.forEach((c) => (c.tags || []).forEach((t) => s.add(t))); return [...s].sort(); }

export function summaryCounts(db: CrmDB, stateOf: (c: Contact) => ContactState) {
  let overdue = 0, owe = 0, bdays = 0;
  db.contacts.forEach((c) => { const s = stateOf(c); if (s.oweReply) owe++; else if (s.overdue) overdue++; if (s.bdayIn != null && s.bdayIn <= 30) bdays++; });
  return { overdue, owe, bdays, total: db.contacts.length };
}
export function attentionList(db: CrmDB, stateOf: (c: Contact) => ContactState, groupOverdue: (g: Group) => boolean) {
  const contacts = db.contacts.map((c) => ({ c, s: stateOf(c) }))
    .filter((x) => x.s.oweReply || x.s.overdue || (x.s.bdayIn != null && x.s.bdayIn <= 14))
    .sort((a, b) => { const r = (x: typeof a) => (x.s.oweReply ? 0 : x.s.bdayIn != null && x.s.bdayIn <= 14 ? 1 : 2); return r(a) - r(b) || ((b.s.days || 0) - (a.s.days || 0)); });
  const groups = db.groups.filter(groupOverdue);
  return { contacts, groups };
}
export interface PeopleFilter { tier: string; tag: string; sort: "overdue" | "recent" | "name"; q: string; }
export function filterSortContacts(db: CrmDB, stateOf: (c: Contact) => ContactState, f: PeopleFilter) {
  const q = lc(f.q);
  const list = db.contacts.filter((c) =>
    (f.tier === "all" || c.tier === f.tier) &&
    (f.tag === "all" || (c.tags || []).map(lc).includes(lc(f.tag))) &&
    (!q || lc(c.name).includes(q) || contactEmails(c).some((e) => e.includes(q)) || lc(c.notes).includes(q) || (c.tags || []).some((t) => lc(t).includes(q)))
  ).map((c) => ({ c, s: stateOf(c) }));
  if (f.sort === "overdue") list.sort((a, b) => (Number(b.s.overdue) - Number(a.s.overdue)) || ((b.s.days || 0) - (a.s.days || 0)));
  else if (f.sort === "recent") list.sort((a, b) => (a.s.days == null ? 1e9 : a.s.days) - (b.s.days == null ? 1e9 : b.s.days));
  else list.sort((a, b) => a.c.name.localeCompare(b.c.name));
  return list;
}

/** Rank CRM contacts whose name or primary email matches `query` (case-insensitive substring).
 *  Prefix matches rank above interior matches; empty query → []. Contacts without an email are skipped. */
export function matchContacts(db: CrmDB, query: string, limit = 6): { name: string; email: string }[] {
  const q = lc(String(query || "").trim());
  if (!q) return [];
  const scored: { name: string; email: string; score: number }[] = [];
  for (const c of db.contacts) {
    const email = contactEmails(c)[0] || "";
    if (!email) continue;
    const name = c.name || "";
    const nl = lc(name), el = lc(email);
    let score = -1;
    if (nl.startsWith(q) || el.startsWith(q)) score = 0;
    else if (nl.includes(q) || el.includes(q)) score = 1;
    if (score >= 0) scored.push({ name, email, score });
  }
  scored.sort((a, b) => a.score - b.score || a.name.localeCompare(b.name));
  return scored.slice(0, limit).map(({ name, email }) => ({ name, email }));
}
