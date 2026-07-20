import { describe, it, expect } from "vitest";
import { buildGmailMap, buildCalMap, interactionsFor, tlIcon, formatRecent } from "@/lib/dashboard/people/interactions";
import type { GmailHeaderRow, CalendarEvent, Contact } from "@/lib/dashboard/people/types";

const NOW = new Date("2026-07-11T12:00:00Z");
const contact = (): Contact => ({ id: "amir@x.com", name: "Amir", emails: ["amir@x.com"], tier: "Friends", tags: [], lastTouch: null, snoozeUntil: null, log: [{ date: "2026-06-01T12:00:00Z", type: "Call", note: "caught up" }] });

describe("interaction maps", () => {
  it("outbound from me → recorded on each recipient as dir:out; inbound → dir:in", () => {
    const rows: GmailHeaderRow[] = [
      { from: "hamdanhamzeh0@gmail.com", to: ["amir@x.com"], date: "2026-06-10T00:00:00Z", subject: "hi", mailbox: "sent" },
      { from: "amir@x.com", to: ["hamdanhamzeh0@gmail.com"], date: "2026-06-20T00:00:00Z", subject: "re: hi", mailbox: "inbox" },
    ];
    const g = buildGmailMap(rows, NOW);
    expect(g["amir@x.com"].count).toBe(2);
    expect(g["amir@x.com"].lastDir).toBe("in");
    expect(g["amir@x.com"].last).toBe("2026-06-20T00:00:00Z");
  });
  it("drops non-person + future-dated messages", () => {
    const rows: GmailHeaderRow[] = [
      { from: "noreply@x.com", to: ["hamdanhamzeh0@gmail.com"], date: "2026-06-10T00:00:00Z", subject: "ad", mailbox: "inbox" },
      { from: "amir@x.com", to: ["hamdanhamzeh0@gmail.com"], date: "2027-01-01T00:00:00Z", subject: "future", mailbox: "inbox" },
    ];
    expect(Object.keys(buildGmailMap(rows, NOW))).toEqual([]);
  });
  it("cal map splits past vs next and skips self/non-person attendees", () => {
    const evs: CalendarEvent[] = [{ summary: "Coffee", start: "2026-05-01T00:00:00Z", attendees: [{ email: "amir@x.com" }, { email: "me@x.com", self: true }] },
      { summary: "Lunch", start: "2026-08-01T00:00:00Z", attendees: [{ email: "amir@x.com" }] }];
    const c = buildCalMap(evs, NOW);
    expect(c["amir@x.com"].lastPast).toBe("2026-05-01T00:00:00Z");
    expect(c["amir@x.com"].next).toBe("2026-08-01T00:00:00Z");
    expect(c["me@x.com"]).toBeUndefined();
  });
  it("interactionsFor merges email+event+log newest-first; tlIcon reflects type/direction", () => {
    const g = buildGmailMap([{ from: "amir@x.com", to: ["hamdanhamzeh0@gmail.com"], date: "2026-06-25T00:00:00Z", subject: "hey", mailbox: "inbox" }], NOW);
    const c = buildCalMap([{ summary: "Coffee", start: "2026-05-01T00:00:00Z", attendees: [{ email: "amir@x.com" }] }], NOW);
    const tl = interactionsFor(contact(), g, c);
    expect(tl[0].date >= tl[1].date).toBe(true);
    expect(tlIcon({ type: "email", dir: "in", date: "", text: "" })).toBe("⬅️");
    expect(tlIcon({ type: "event", date: "", text: "" })).toBe("📅");
  });
  it("formatRecent labels direction/type and carries the (untrusted) subject text", () => {
    const g = buildGmailMap([
      { from: "amir@x.com", to: ["hamdanhamzeh0@gmail.com"], date: "2026-06-25T00:00:00Z", subject: "launch pricing?", mailbox: "inbox" },
      { from: "hamdanhamzeh0@gmail.com", to: ["amir@x.com"], date: "2026-06-26T00:00:00Z", subject: "sounds good", mailbox: "sent" },
    ], NOW);
    const lines = formatRecent(interactionsFor(contact(), g, {}));
    expect(lines[0]).toMatch(/I wrote: sounds good/);
    expect(lines[1]).toMatch(/they wrote: launch pricing\?/);
    expect(lines.some((l) => /Call — caught up/.test(l))).toBe(true);
  });
  it("cross-format: buildCalMap picks lastPast/next by instant, not string (#37)", () => {
    const evs: CalendarEvent[] = [
      { summary: "all-day", start: "2026-06-22", attendees: [{ email: "amir@x.com" }] },                     // 00:00 on the 22nd
      { summary: "late", start: "2026-06-21T23:00:00-05:00", attendees: [{ email: "amir@x.com" }] },          // = 04:00Z on the 22nd — LATER past
      { summary: "future all-day", start: "2026-08-02", attendees: [{ email: "amir@x.com" }] },               // 00:00 on Aug 2 — SOONER future
      { summary: "future late", start: "2026-08-01T21:00:00-05:00", attendees: [{ email: "amir@x.com" }] },   // = 02:00Z on Aug 2
    ];
    const m = buildCalMap(evs, NOW);
    expect(m["amir@x.com"].lastPast).toBe("2026-06-21T23:00:00-05:00");
    expect(m["amir@x.com"].next).toBe("2026-08-02");
  });
  it("cross-format: interactionsFor sorts the merged timeline by instant (#37)", () => {
    const g = buildGmailMap([{ from: "amir@x.com", to: ["hamdanhamzeh0@gmail.com"], date: "2026-06-21T20:00:00.000Z", subject: "hey", mailbox: "inbox" }], NOW);
    const cal = buildCalMap([
      { summary: "party", start: "2026-06-22", attendees: [{ email: "amir@x.com" }] },
      { summary: "dinner", start: "2026-06-21T23:00:00-05:00", attendees: [{ email: "amir@x.com" }] },
    ], NOW);
    const tl = interactionsFor({ ...contact(), log: [] }, g, cal);
    expect(tl.map((i) => i.date)).toEqual(["2026-06-21T23:00:00-05:00", "2026-06-22", "2026-06-21T20:00:00.000Z"]);
  });
  it("NaN-safe sort: a malformed log timestamp does not scramble valid rows' relative order (#37)", () => {
    const g = buildGmailMap([
      { from: "amir@x.com", to: ["hamdanhamzeh0@gmail.com"], date: "2026-06-20T00:00:00Z", subject: "newer", mailbox: "inbox" },
      { from: "amir@x.com", to: ["hamdanhamzeh0@gmail.com"], date: "2026-06-10T00:00:00Z", subject: "older", mailbox: "inbox" },
    ], NOW);
    const withBadLog: Contact = { ...contact(), log: [{ date: "not-a-real-date", type: "Call", note: "bad" }] };
    const tl = interactionsFor(withBadLog, g, {});
    const validOrder = tl.filter((i) => i.type === "email").map((i) => i.text);
    expect(validOrder).toEqual(["newer", "older"]); // valid rows keep correct instant order despite the NaN row
    expect(tl.some((i) => i.text === "Call — bad")).toBe(true); // malformed row still present, not dropped
  });

  describe("saved-contact gate bypasses isPerson (#66)", () => {
    it("keeps activity for a saved contact whose address trips an isPerson heuristic", () => {
      const rows: GmailHeaderRow[] = [{ from: "hamdanhamzeh0@gmail.com", to: ["team@bigco.com"], date: "2026-05-01T00:00:00Z", subject: "hi", mailbox: "sent" }];
      // "team" is a BADWORDS_ROLE_EXACT local-part → isPerson("team@bigco.com") is false.
      const withoutSaved = buildGmailMap(rows, new Date("2026-06-01"));
      expect(withoutSaved["team@bigco.com"]).toBeUndefined(); // dropped by heuristic today
      const withSaved = buildGmailMap(rows, new Date("2026-06-01"), new Set(["team@bigco.com"]));
      expect(withSaved["team@bigco.com"]?.count).toBe(1); // saved → kept
    });

    it("still filters a non-saved spammy address (unchanged default behavior)", () => {
      const rows: GmailHeaderRow[] = [{ from: "noreply@x.com", to: ["hamdanhamzeh0@gmail.com"], date: "2026-06-10T00:00:00Z", subject: "ad", mailbox: "inbox" }];
      const g = buildGmailMap(rows, NOW, new Set(["someoneelse@x.com"]));
      expect(g["noreply@x.com"]).toBeUndefined();
    });

    it("leaves a normal person address unaffected by the saved set", () => {
      const rows: GmailHeaderRow[] = [{ from: "amir@x.com", to: ["hamdanhamzeh0@gmail.com"], date: "2026-06-10T00:00:00Z", subject: "hi", mailbox: "inbox" }];
      const withoutSaved = buildGmailMap(rows, NOW);
      const withSaved = buildGmailMap(rows, NOW, new Set(["amir@x.com"]));
      expect(withoutSaved["amir@x.com"]?.count).toBe(1);
      expect(withSaved["amir@x.com"]?.count).toBe(1);
    });

    it("buildCalMap keeps a saved attendee that trips isPerson, and preserves instant ordering (#37) once kept", () => {
      const evs: CalendarEvent[] = [
        { summary: "all-day", start: "2026-06-22", attendees: [{ email: "team@bigco.com" }] },              // 00:00 on the 22nd
        { summary: "late", start: "2026-06-21T23:00:00-05:00", attendees: [{ email: "team@bigco.com" }] },   // = 04:00Z on the 22nd — LATER past
      ];
      const withoutSaved = buildCalMap(evs, NOW);
      expect(withoutSaved["team@bigco.com"]).toBeUndefined(); // dropped by heuristic today
      const withSaved = buildCalMap(evs, NOW, new Set(["team@bigco.com"]));
      // Instant ordering (not string ordering) must still pick "late" as lastPast, per #37.
      expect(withSaved["team@bigco.com"].lastPast).toBe("2026-06-21T23:00:00-05:00");
    });
  });
});
