import { describe, it, expect } from "vitest";
import { normalizeDb, emptyDb } from "@/lib/dashboard/people/backup";

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
