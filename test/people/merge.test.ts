// test/people/merge.test.ts
import { describe, it, expect } from "vitest";
import { findContactClash, mergeContactFillEmpty } from "@/lib/dashboard/people/merge";
import type { Contact } from "@/lib/dashboard/people/types";

function makeContact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: "alex@x.com",
    name: "Alex",
    emails: ["alex@x.com"],
    phone: "555-1111",
    tier: "Friends",
    cadenceDays: 30,
    birthday: "01-02",
    howWeMet: "college",
    tags: ["gym"],
    notes: "curated notes",
    avatarImg: "avatar.png",
    lastTouch: "2026-01-01T00:00:00Z",
    snoozeUntil: null,
    log: [{ date: "2026-01-01T00:00:00Z", type: "Call", note: "hi" }],
    ...overrides,
  };
}

describe("findContactClash", () => {
  it("matches by id", () => {
    const contacts = [makeContact()];
    expect(findContactClash(contacts, "alex@x.com", ["someone-else@y.com"])?.id).toBe("alex@x.com");
  });

  it("matches by a shared email even when the id differs", () => {
    const contacts = [makeContact({ id: "alex-legacy-id" })];
    expect(findContactClash(contacts, "new-id", ["ALEX@X.COM"])?.id).toBe("alex-legacy-id");
  });

  it("is case-insensitive on email", () => {
    const contacts = [makeContact()];
    expect(findContactClash(contacts, "nope", ["Alex@X.Com"])?.id).toBe("alex@x.com");
  });

  it("returns undefined when nothing collides", () => {
    const contacts = [makeContact()];
    expect(findContactClash(contacts, "new-id", ["nobody@z.com"])).toBeUndefined();
  });

  it("does not mutate the contacts array", () => {
    const contacts = [makeContact()];
    const snapshot = JSON.stringify(contacts);
    findContactClash(contacts, "alex@x.com", ["alex@x.com"]);
    expect(JSON.stringify(contacts)).toBe(snapshot);
  });
});

describe("mergeContactFillEmpty", () => {
  it("keeps existing curated values over incoming ones (#57 default-safe merge)", () => {
    const existing = makeContact();
    const incoming = {
      name: "Alexander",
      emails: ["alex@x.com"],
      phone: "555-9999",
      tier: "Family",
      cadenceDays: 7,
      birthday: "03-04",
      howWeMet: "work",
      tags: ["work"],
      notes: "incoming notes",
      avatarImg: "new.png",
    };
    const merged = mergeContactFillEmpty(existing, incoming);
    expect(merged.name).toBe("Alex");
    expect(merged.phone).toBe("555-1111");
    expect(merged.tier).toBe("Friends");
    expect(merged.cadenceDays).toBe(30);
    expect(merged.birthday).toBe("01-02");
    expect(merged.howWeMet).toBe("college");
    expect(merged.notes).toBe("curated notes");
    expect(merged.avatarImg).toBe("avatar.png");
  });

  it("fills blank existing fields from incoming values", () => {
    const existing = makeContact({ phone: "", birthday: "", howWeMet: "", notes: "", avatarImg: null, name: "" });
    const incoming = {
      name: "Alex Fallback",
      emails: ["alex@x.com"],
      phone: "555-2222",
      tier: "Family",
      cadenceDays: 7,
      birthday: "03-04",
      howWeMet: "work",
      tags: [],
      notes: "filled notes",
      avatarImg: "filled.png",
    };
    const merged = mergeContactFillEmpty(existing, incoming);
    expect(merged.name).toBe("Alex Fallback");
    expect(merged.phone).toBe("555-2222");
    expect(merged.birthday).toBe("03-04");
    expect(merged.howWeMet).toBe("work");
    expect(merged.notes).toBe("filled notes");
    expect(merged.avatarImg).toBe("filled.png");
  });

  it("unions tags and emails instead of replacing them", () => {
    const existing = makeContact({ tags: ["gym"], emails: ["alex@x.com"] });
    const incoming = {
      name: "Alex",
      emails: ["alex@x.com", "alex.new@x.com"],
      phone: "",
      tier: "Friends",
      cadenceDays: 30,
      birthday: "",
      howWeMet: "",
      tags: ["gym", "college"],
      notes: "",
      avatarImg: null,
    };
    const merged = mergeContactFillEmpty(existing, incoming);
    expect(merged.tags.sort()).toEqual(["college", "gym"]);
    expect(merged.emails.sort()).toEqual(["alex.new@x.com", "alex@x.com"]);
  });

  it("keeps the existing contact's id, log, lastTouch, snoozeUntil (never adopts the add-form's derived id)", () => {
    const existing = makeContact({ id: "alex@x.com", lastTouch: "2026-05-01T00:00:00Z", snoozeUntil: "2026-06-01T00:00:00Z" });
    const incoming = {
      name: "Alex",
      emails: ["alex@x.com"],
      phone: "",
      tier: "Friends",
      cadenceDays: 30,
      birthday: "",
      howWeMet: "",
      tags: [],
      notes: "",
      avatarImg: null,
    };
    const merged = mergeContactFillEmpty(existing, incoming);
    expect(merged.id).toBe("alex@x.com");
    expect(merged.log).toBe(existing.log);
    expect(merged.lastTouch).toBe("2026-05-01T00:00:00Z");
    expect(merged.snoozeUntil).toBe("2026-06-01T00:00:00Z");
  });

  it("does not mutate either argument", () => {
    const existing = makeContact();
    const existingSnapshot = JSON.stringify(existing);
    const incoming = {
      name: "Alexander",
      emails: ["alex@x.com", "extra@x.com"],
      phone: "555-9999",
      tier: "Family",
      cadenceDays: 7,
      birthday: "03-04",
      howWeMet: "work",
      tags: ["work"],
      notes: "incoming notes",
      avatarImg: "new.png",
    };
    const incomingSnapshot = JSON.stringify(incoming);
    mergeContactFillEmpty(existing, incoming);
    expect(JSON.stringify(existing)).toBe(existingSnapshot);
    expect(JSON.stringify(incoming)).toBe(incomingSnapshot);
  });
});
