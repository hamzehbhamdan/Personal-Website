import { DEFAULT_TIERS } from "./tiers";
import type { CrmDB, CrmSettings, VoiceProfile } from "./types";
export const emptyDb = (): CrmDB => ({ version: 1, contacts: [], groups: [], dismissed: [], tiers: DEFAULT_TIERS.map((t) => ({ ...t })), settings: { autoTags: false } });

function normalizeVoice(v: any): VoiceProfile | undefined {
  if (!v || typeof v !== "object") return undefined;
  const cap = (x: any, n: number) => (typeof x === "string" && x ? x.slice(0, n) : undefined);
  const out: VoiceProfile = {};
  const tone = cap(v.tone, 60); if (tone) out.tone = tone;
  const styleGuide = cap(v.styleGuide, 8000); if (styleGuide) out.styleGuide = styleGuide;
  const styleNotes = cap(v.styleNotes, 2000); if (styleNotes) out.styleNotes = styleNotes;
  const styleSummary = cap(v.styleSummary, 4000); if (styleSummary) out.styleSummary = styleSummary;
  if (Array.isArray(v.examples)) {
    const ex = v.examples.filter((e: any) => typeof e === "string" && e).slice(0, 5).map((e: string) => e.slice(0, 1000));
    if (ex.length) out.examples = ex;
  }
  if (Array.isArray(v.sentSamples)) {
    const ss = v.sentSamples.filter((s: any) => s && typeof s === "object").slice(0, 20).map((s: any) => ({ subject: String(s.subject ?? "").slice(0, 300), date: String(s.date ?? "").slice(0, 40) }));
    if (ss.length) out.sentSamples = ss;
  }
  return Object.keys(out).length ? out : undefined;
}

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
  const rs = r.settings && typeof r.settings === "object" ? r.settings : {};
  const settings: CrmSettings = { autoTags: !!rs.autoTags };
  const voice = normalizeVoice(rs.voice);
  if (voice) settings.voice = voice;
  return {
    version: typeof r.version === "number" ? r.version : 1,
    contacts,
    groups,
    dismissed: Array.isArray(r.dismissed) ? [...r.dismissed] : [],
    tiers,
    settings,
  };
}
export function validateBackup(obj: any): { ok: boolean; reason?: string } {
  if (!obj || typeof obj !== "object" || !Array.isArray(obj.contacts)) return { ok: false, reason: "not a CRM backup" };
  return { ok: true };
}
