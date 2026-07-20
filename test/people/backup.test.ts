import { describe, it, expect } from "vitest";
import { normalizeDb, emptyDb, validateBackup } from "@/lib/dashboard/people/backup";
import { filterSortContacts } from "@/lib/dashboard/people/select";
import type { ContactState } from "@/lib/dashboard/people/types";

describe("normalizeDb — voice migration", () => {
  it("carries a voice profile through a normalize round-trip", () => {
    const raw = { contacts: [], settings: { autoTags: true, voice: { tone: "warm", styleGuide: "I write short.", styleNotes: "sign off with -H", styleSummary: "casual", examples: ["hey!", "quick one"], sentSamples: [{ subject: "re: coffee", date: "2026-07-01" }] } } };
    const db = normalizeDb(raw);
    expect(db.settings.autoTags).toBe(true);
    expect(db.settings.voice).toEqual(raw.settings.voice);
  });
  it("caps over-long voice fields", () => {
    const raw = { settings: { autoTags: false, voice: { tone: "t".repeat(200), styleGuide: "g".repeat(20000), styleNotes: "n".repeat(9000), styleSummary: "s".repeat(9000), examples: Array(20).fill("e".repeat(5000)), sentSamples: Array(50).fill({ subject: "x".repeat(1000), date: "d".repeat(100) }) } } };
    const v = normalizeDb(raw).settings.voice!;
    expect(v.tone!.length).toBe(60);
    expect(v.styleGuide!.length).toBe(8000);
    expect(v.styleNotes!.length).toBe(2000);
    expect(v.styleSummary!.length).toBe(4000);
    expect(v.examples!.length).toBe(5);
    expect(v.examples![0].length).toBe(1000);
    expect(v.sentSamples!.length).toBe(20);
    expect(v.sentSamples![0].subject.length).toBe(300);
    expect(v.sentSamples![0].date.length).toBe(40);
  });
  it("omits voice entirely when absent (stays optional)", () => {
    expect(normalizeDb({ settings: { autoTags: false } }).settings).not.toHaveProperty("voice");
    expect(normalizeDb({}).settings).not.toHaveProperty("voice");
    expect(emptyDb().settings).not.toHaveProperty("voice");
  });
  it("is idempotent + does not mutate input", () => {
    const raw = { settings: { autoTags: true, voice: { tone: "warm", examples: ["a"] } } };
    const snap = JSON.stringify(raw);
    const once = normalizeDb(raw);
    const twice = normalizeDb(once);
    expect(twice.settings.voice).toEqual(once.settings.voice);
    expect(JSON.stringify(raw)).toBe(snap);
    expect(once.settings.voice).not.toBe(raw.settings.voice);
  });
  it("preserves autoTags behavior", () => {
    expect(normalizeDb({ settings: { autoTags: true } }).settings.autoTags).toBe(true);
    expect(normalizeDb({ settings: {} }).settings.autoTags).toBe(false);
    expect(normalizeDb({}).settings.autoTags).toBe(false);
  });
});

describe("normalizeDb + validateBackup — malformed backups stay views-safe (#35)", () => {
  const stateStub = (): ContactState => ({ last: null, days: null, cad: 90, overdue: false, soon: false, snoozed: false, oweReply: false, calNext: null, bdayIn: null });

  it("validateBackup rejects contacts without a usable id (empty/missing after String() coercion)", () => {
    expect(validateBackup({ contacts: [{}] })).toEqual({ ok: false, reason: "contacts missing ids" });
    expect(validateBackup({ contacts: [null] }).ok).toBe(false);
    expect(validateBackup({ contacts: [{ id: "" }] }).ok).toBe(false);
    expect(validateBackup({ contacts: [{ id: "a" }] }).ok).toBe(true);
    expect(validateBackup({ contacts: [] }).ok).toBe(true); // unchanged contract (csv.test.ts pins this too)
  });

  it("CR5: validateBackup accepts numeric ids — normalizeDb coerces them via String(), it never drops them", () => {
    // Pre-fix, validateBackup's `typeof id !== "string"` gate rejected a numeric id even
    // though normalizeDb's own filter (`String(c.id ?? "") !== ""`) and coercion
    // (`id: String(c.id)`) accept and KEEP it. That mismatch refused an otherwise fully
    // restorable foreign/legacy backup.
    expect(validateBackup({ contacts: [{ id: 5 }] }).ok).toBe(true);
    expect(validateBackup({ contacts: [{ id: 0 }] }).ok).toBe(true); // falsy number, but String(0) = "0" is non-empty
    const raw = { contacts: [{ id: 42, name: "Numeric Id" }] };
    expect(validateBackup(raw).ok).toBe(true);
    const imported = normalizeDb(raw);
    expect(imported.contacts.map((c) => c.id)).toEqual(["42"]);
  });

  it("CR5: a truly missing/empty id still fails validateBackup (null/undefined/empty string, mirroring String(id ?? \"\"))", () => {
    expect(validateBackup({ contacts: [{ id: null }] }).ok).toBe(false);
    expect(validateBackup({ contacts: [{ id: undefined }] }).ok).toBe(false);
    expect(validateBackup({ contacts: [{ id: "" }] }).ok).toBe(false);
    // NaN is not nullish, so `NaN ?? ""` is NaN and String(NaN) = "NaN" (non-empty) — normalizeDb
    // KEEPS it (coerced to "NaN"), so validateBackup must accept it too, for the same reason
    // numeric ids are accepted: rejecting it would refuse a backup normalizeDb can restore fine.
    expect(validateBackup({ contacts: [{ id: NaN }] }).ok).toBe(true);
  });
  it("normalizeDb drops id-less rows and coerces name/tier so no view dereference can throw", () => {
    const d = normalizeDb({ contacts: [{}, null, "junk", { id: "a" }, { id: "b", name: 7, tier: null }], connections: [{ a: "a", b: "b" }, { a: "a", b: "ghost" }] });
    expect(d.contacts.map((c) => c.id)).toEqual(["a", "b"]);
    expect(d.contacts.every((c) => typeof c.name === "string" && typeof c.tier === "string")).toBe(true);
    expect(d.contacts[1].name).toBe("7");
    expect(d.connections).toEqual([{ a: "a", b: "b" }]); // edges between surviving ids kept
    // the reported crash sites: name sort (select.ts:31 localeCompare) and name.trim() (NetworkPanel:249)
    expect(() => filterSortContacts(d, stateStub, { tier: "all", tag: "all", sort: "name", q: "" })).not.toThrow();
    expect(() => d.contacts.map((c) => c.name.trim())).not.toThrow();
  });
  it("stays idempotent + pure with the gate in place", () => {
    const raw = { contacts: [{}, { id: "a", name: "A", tier: "Friends" }] };
    const snap = JSON.stringify(raw);
    const once = normalizeDb(raw);
    expect(normalizeDb(once)).toEqual(once); // second pass drops/changes nothing
    expect(JSON.stringify(raw)).toBe(snap);  // input untouched
  });
});
