// test/people/csv.test.ts
import { describe, it, expect } from "vitest";
import { parseCSV, importCsvInto } from "@/lib/dashboard/people/csv";
import { normalizeDb, emptyDb, validateBackup } from "@/lib/dashboard/people/backup";

describe("csv + backup", () => {
  it("parseCSV handles quotes, escaped quotes, CRLF", () => {
    expect(parseCSV('name,note\r\n"Khan, A","said ""hi"""')).toEqual([["name", "note"], ["Khan, A", 'said "hi"']]);
  });
  it("importCsvInto adds new + updates existing by email, merges tags", () => {
    const db = normalizeDb({ ...emptyDb(), contacts: [{ id: "a@x.com", name: "A", emails: ["a@x.com"], tier: "Friends", tags: ["x"], lastTouch: null, snoozeUntil: null, log: [] }] });
    const csv = "name,email,tags\nAmir,a@x.com,gym;college\nBex,b@y.com,school";
    const { db: out, added, updated } = importCsvInto(db, parseCSV(csv));
    expect(added).toBe(1); expect(updated).toBe(1);
    expect(out.contacts.find((c) => c.id === "a@x.com")!.tags.sort()).toEqual(["college", "gym", "x"]);
  });
  it("normalizeDb fills defaults (tiers, settings, tags, log arrays)", () => {
    const d = normalizeDb({ version: 1, contacts: [{ id: "a", name: "A", emails: [], tier: "Friends" } as any] });
    expect(d.tiers.length).toBe(5); expect(d.settings.autoTags).toBe(false);
    expect(d.contacts[0].tags).toEqual([]); expect(d.contacts[0].log).toEqual([]);
  });
  it("normalizeDb is PURE — does not mutate its input, returns fresh references", () => {
    const raw: any = { version: 1, contacts: [{ id: "a", name: "A", emails: [], tier: "Friends" }] };
    const snapshot = JSON.parse(JSON.stringify(raw));
    const out = normalizeDb(raw);
    expect(raw).toEqual(snapshot);                       // input untouched
    expect(raw.contacts[0]).not.toHaveProperty("tags");  // no defaults leaked back in
    expect(out.contacts[0]).not.toBe(raw.contacts[0]);   // fresh contact object
    expect(out.contacts).not.toBe(raw.contacts);         // fresh array
  });
  it("validateBackup rejects non-CRM objects", () => {
    expect(validateBackup({ nope: 1 }).ok).toBe(false);
    expect(validateBackup({ contacts: [] }).ok).toBe(true);
  });
  it("importCsvInto is PURE — does not mutate input db or share nested log references", () => {
    const db = normalizeDb({ ...emptyDb(), contacts: [{ id: "a@x.com", name: "A", emails: ["a@x.com"], tier: "Friends", tags: ["x"], lastTouch: null, snoozeUntil: null, log: [{ date: "2026-01-01T00:00:00Z", type: "Call", note: "hi" }] }] });
    const snapshot = JSON.stringify(db);
    const { db: out } = importCsvInto(db, parseCSV("name,email,tags\nAmir,a@x.com,gym\nBex,b@y.com,school"));
    expect(JSON.stringify(db)).toBe(snapshot);            // input untouched
    expect(out.contacts).not.toBe(db.contacts);          // fresh array
    const outA = out.contacts.find((c) => c.id === "a@x.com")!;
    const dbA = db.contacts.find((c) => c.id === "a@x.com")!;
    expect(outA).not.toBe(dbA);                          // fresh contact object
    expect(outA.log).not.toBe(dbA.log);                  // fresh log array (regression guard)
    outA.log.push({ date: "2026-02-02T00:00:00Z", type: "Text / message", note: "later" });
    expect(dbA.log.length).toBe(1);                      // mutating the copy must NOT touch the original
  });
});
