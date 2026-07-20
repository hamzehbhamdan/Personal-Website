import { contactEmails } from "./interactions";
import { toEpochMs } from "./text";
import type { CrmDB, GmailMap, CalMap, Suggestion } from "./types";

/** Port of renderSuggestions aggregation (crm.html:359-366). */
export function buildSuggestions(db: CrmDB, gmail: GmailMap, cal: CalMap): Suggestion[] {
  const known = new Set<string>(); db.contacts.forEach((c) => contactEmails(c).forEach((e) => known.add(e)));
  const dis = new Set(db.dismissed || []);
  const agg: Record<string, Suggestion> = {};
  Object.keys(gmail).forEach((e) => { if (known.has(e) || dis.has(e)) return; const a = (agg[e] ||= { email: e, score: 0, last: null }); a.score += gmail[e].count; if (gmail[e].last && (!a.last || toEpochMs(gmail[e].last!) > toEpochMs(a.last))) a.last = gmail[e].last; });
  Object.keys(cal).forEach((e) => { if (known.has(e) || dis.has(e)) return; const a = (agg[e] ||= { email: e, score: 0, last: null }); a.score += 3 * cal[e].events.length; const l = cal[e].lastPast || cal[e].next; if (l && (!a.last || toEpochMs(l) > toEpochMs(a.last))) a.last = l; });
  return Object.values(agg).sort((a, b) => b.score - a.score).slice(0, 25);
}
