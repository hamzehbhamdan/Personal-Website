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
});
