import { lc, daysBetween } from "./text";
import type { Contact, Group, SmartRule, CrmDB, GroupStateResult } from "./types";

export function matchesRule(c: Contact, rule: SmartRule | null, isOverdue: (c: Contact) => boolean): boolean {
  if (!rule) return false;
  if (rule.kind === "all") return true;
  if (rule.kind === "tier") return c.tier === rule.value;
  if (rule.kind === "tag") return (c.tags || []).map(lc).includes(lc(rule.value));
  if (rule.kind === "overdue") return isOverdue(c);
  return false;
}
export function membersOf(db: Pick<CrmDB, "contacts">, g: Group, isOverdue: (c: Contact) => boolean): string[] {
  return g.type === "smart" ? db.contacts.filter((c) => matchesRule(c, g.rule, isOverdue)).map((c) => c.id) : (g.members || []);
}
export function groupsForContact(db: CrmDB, id: string, isOverdue: (c: Contact) => boolean): Group[] {
  const c = db.contacts.find((x) => x.id === id);
  return db.groups.filter((g) => (g.type === "smart" ? !!c && matchesRule(c, g.rule, isOverdue) : (g.members || []).includes(id)));
}
export function groupState(g: Group, now: Date): GroupStateResult {
  const cad = g.cadenceDays || null;
  const days = g.lastTouch ? daysBetween(now, new Date(g.lastTouch)) : null;
  const snoozed = !!(g.snoozeUntil && new Date(g.snoozeUntil) > now);
  const overdue = !!cad && !snoozed && (days == null || days > cad);
  return { cad, days, overdue, snoozed };
}
