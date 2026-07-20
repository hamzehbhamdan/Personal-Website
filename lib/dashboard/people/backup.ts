import { DEFAULT_TIERS } from "./tiers";
import { pruneEdges } from "./connections";
import type { CrmDB, CrmSettings, VoiceProfile } from "./types";
export const emptyDb = (): CrmDB => ({ version: 1, contacts: [], groups: [], dismissed: [], tiers: DEFAULT_TIERS.map((t) => ({ ...t })), settings: { autoTags: false }, connections: [] });

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
  // Schema gate for the fields every view dereferences (review #35): drop rows without a
  // usable id (unkeyable — would break getContact, edge pruning, and React keys) and coerce
  // name/tier to strings so .localeCompare/.trim() sites can never throw. Deterministic and
  // idempotent: a second pass drops nothing and re-coercion is a no-op. Nameless contacts
  // are KEPT (coerced to ""), preserving their edges (see connections.test.ts).
  const contacts = (Array.isArray(r.contacts) ? r.contacts : [])
    .filter((c: unknown) => !!c && typeof c === "object" && String((c as Record<string, unknown>).id ?? "") !== "")
    .map((c: any) => ({
      ...c,
      id: String(c.id),
      name: String(c.name ?? ""),
      tier: String(c.tier ?? ""),
      emails: Array.isArray(c.emails) ? [...c.emails] : [],
      tags: Array.isArray(c.tags) ? [...c.tags] : [],
      log: Array.isArray(c.log) ? c.log.map((l: any) => ({ ...l })) : [],
      lastTouch: c.lastTouch === undefined ? null : c.lastTouch,
      snoozeUntil: c.snoozeUntil === undefined ? null : c.snoozeUntil,
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
  // connections must be threaded through EXPLICITLY — the return literal is the
  // schema gate, so an unlisted top-level field would be dropped on every load.
  // Prune to canonical, non-dangling, deduped edges over the current contacts.
  const contactIds = new Set<string>(contacts.map((c: any) => c?.id).filter(Boolean));
  return {
    version: typeof r.version === "number" ? r.version : 1,
    contacts,
    groups,
    dismissed: Array.isArray(r.dismissed) ? [...r.dismissed] : [],
    tiers,
    settings,
    connections: pruneEdges(r.connections, contactIds),
  };
}
export function validateBackup(obj: any): { ok: boolean; reason?: string } {
  if (!obj || typeof obj !== "object" || !Array.isArray(obj.contacts)) return { ok: false, reason: "not a CRM backup" };
  // Import gate (review #35): every contact must be an object with a usable id — normalizeDb
  // silently DROPS offending rows, so reject up front rather than restore a backup that would
  // lose contacts. Names are NOT required: normalizeDb coerces them, and requiring one would
  // reject otherwise-usable foreign backups.
  // The id check mirrors normalizeDb's ACTUAL acceptance rule (review CR5): normalizeDb keeps
  // a row when `String(c.id ?? "") !== ""` and then coerces `id: String(c.id)` — it does not
  // require the id to already be a string. A numeric (or other non-nullish, non-empty-after-
  // coercion) id is fully restorable, so rejecting it here — as a bare `typeof id !== "string"`
  // check used to — refused backups normalizeDb would have imported fine. Only reject when the
  // SAME coercion normalizeDb applies yields "" (id is null, undefined, or already "").
  if (obj.contacts.some((c: unknown) => {
    if (!c || typeof c !== "object") return true;
    const id = (c as Record<string, unknown>).id;
    return String(id ?? "") === "";
  })) {
    return { ok: false, reason: "contacts missing ids" };
  }
  return { ok: true };
}
