import { DEFAULT_TIERS } from "./tiers";
import type { CrmDB } from "./types";
export const emptyDb = (): CrmDB => ({ version: 1, contacts: [], groups: [], dismissed: [], tiers: DEFAULT_TIERS.map((t) => ({ ...t })), settings: { autoTags: false } });

/**
 * PURE port of load()+import normalization (crm.html:234-240, 629).
 * Never mutates `raw`; every array/object in the result is freshly built.
 * Idempotent; safe on partial docs and safe to call during render or inside a setState updater.
 */
export function normalizeDb(raw: any): CrmDB {
  const r = raw && typeof raw === "object" ? raw : {};
  const contacts = (Array.isArray(r.contacts) ? r.contacts : []).map((c: any) => ({
    ...c,
    emails: Array.isArray(c?.emails) ? [...c.emails] : [],
    tags: Array.isArray(c?.tags) ? [...c.tags] : [],
    log: Array.isArray(c?.log) ? c.log.map((l: any) => ({ ...l })) : [],
    lastTouch: c?.lastTouch === undefined ? null : c.lastTouch,
    snoozeUntil: c?.snoozeUntil === undefined ? null : c.snoozeUntil,
  }));
  const groups = (Array.isArray(r.groups) ? r.groups : []).map((g: any) => ({
    ...g,
    members: Array.isArray(g?.members) ? [...g.members] : [],
    rule: g?.rule ? { ...g.rule } : null,
  }));
  const tiers = Array.isArray(r.tiers) && r.tiers.length ? r.tiers.map((t: any) => ({ ...t })) : DEFAULT_TIERS.map((t) => ({ ...t }));
  return {
    version: typeof r.version === "number" ? r.version : 1,
    contacts,
    groups,
    dismissed: Array.isArray(r.dismissed) ? [...r.dismissed] : [],
    tiers,
    settings: r.settings && typeof r.settings === "object" ? { autoTags: !!r.settings.autoTags } : { autoTags: false },
  };
}
export function validateBackup(obj: any): { ok: boolean; reason?: string } {
  if (!obj || typeof obj !== "object" || !Array.isArray(obj.contacts)) return { ok: false, reason: "not a CRM backup" };
  return { ok: true };
}
