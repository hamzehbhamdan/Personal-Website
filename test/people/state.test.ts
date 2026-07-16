// test/people/state.test.ts
import { describe, it, expect } from "vitest";
import { state } from "@/lib/dashboard/people/state";
import { buildGmailMap, buildCalMap } from "@/lib/dashboard/people/interactions";
import type { Contact, CrmDB } from "@/lib/dashboard/people/types";

const NOW = new Date("2026-07-11T00:00:00Z");
const db = (): Pick<CrmDB, "tiers"> => ({ tiers: [{ name: "Friends", cadenceDays: 60, color: "#000" }, { name: "Inner circle", cadenceDays: 21, color: "#000" }] });
const c = (o: Partial<Contact>): Contact => ({ id: "amir@x.com", name: "A", emails: ["amir@x.com"], tier: "Friends", tags: [], lastTouch: null, snoozeUntil: null, log: [], ...o });

describe("state()", () => {
  it("overdue when never contacted (days null)", () => {
    const s = state(c({}), {}, {}, db(), NOW);
    expect(s.days).toBeNull(); expect(s.overdue).toBe(true); expect(s.cad).toBe(60);
  });
  it("in-touch when recent within cadence", () => {
    const s = state(c({ lastTouch: "2026-07-01T00:00:00Z" }), {}, {}, db(), NOW);
    expect(s.overdue).toBe(false); expect(s.soon).toBe(false);
  });
  it("soon when past 75% of cadence but not overdue", () => {
    const s = state(c({ lastTouch: "2026-05-20T00:00:00Z" }), {}, {}, db(), NOW); // ~52d, cad 60, 0.75*60=45
    expect(s.overdue).toBe(false); expect(s.soon).toBe(true);
  });
  it("snooze suppresses overdue", () => {
    const s = state(c({ snoozeUntil: "2026-08-01T00:00:00Z" }), {}, {}, db(), NOW);
    expect(s.snoozed).toBe(true); expect(s.overdue).toBe(false);
  });
  it("owe-reply when their inbound is latest, within 45d, no later meeting", () => {
    const g = buildGmailMap([{ from: "amir@x.com", to: ["hamdanhamzeh0@gmail.com"], date: "2026-07-05T00:00:00Z", subject: "?", mailbox: "inbox" }], NOW);
    const s = state(c({}), g, {}, db(), NOW);
    expect(s.oweReply).toBe(true);
  });
  it("later meeting cancels owe-reply; uses latest touch across sources", () => {
    const g = buildGmailMap([{ from: "amir@x.com", to: ["hamdanhamzeh0@gmail.com"], date: "2026-07-05T00:00:00Z", subject: "?", mailbox: "inbox" }], NOW);
    const cal = buildCalMap([{ summary: "met", start: "2026-07-08T00:00:00Z", attendees: [{ email: "amir@x.com" }] }], NOW);
    expect(state(c({}), g, cal, db(), NOW).oweReply).toBe(false);
  });
  it("birthday countdown rolls to next year when passed", () => {
    expect(state(c({ birthday: "07-20" }), {}, {}, db(), NOW).bdayIn).toBe(9);
    expect(state(c({ birthday: "01-01" }), {}, {}, db(), NOW).bdayIn).toBeGreaterThan(150);
  });
  it("overdue via the numeric clause when last touch is older than cadence", () => {
    const s = state(c({ lastTouch: "2026-01-01T00:00:00Z" }), {}, {}, db(), NOW); // ~191d, cad 60
    expect(typeof s.days).toBe("number");
    expect(s.days! > s.cad).toBe(true);
    expect(s.overdue).toBe(true);
    expect(s.soon).toBe(false); // overdue takes precedence over soon
  });
  it("last = newest across gmail, calendar, lastTouch, and log (log wins here)", () => {
    const g = buildGmailMap([{ from: "amir@x.com", to: ["hamdanhamzeh0@gmail.com"], date: "2026-06-10T00:00:00Z", subject: "x", mailbox: "inbox" }], NOW);
    const cal = buildCalMap([{ summary: "met", start: "2026-06-20T00:00:00Z", attendees: [{ email: "amir@x.com" }] }], NOW);
    const s = state(c({ lastTouch: "2026-06-01T00:00:00Z", log: [{ date: "2026-06-25T00:00:00Z", type: "Call", note: "hi" }] }), g, cal, db(), NOW);
    expect(s.last).toBe("2026-06-25T00:00:00Z");
  });
  it("no owe-reply when my outbound is the latest message (direction clause)", () => {
    const g = buildGmailMap([{ from: "hamdanhamzeh0@gmail.com", to: ["amir@x.com"], date: "2026-07-05T00:00:00Z", subject: "hi", mailbox: "sent" }], NOW);
    expect(state(c({}), g, {}, db(), NOW).oweReply).toBe(false);
  });
  it("no owe-reply when their inbound is older than 45 days (window clause)", () => {
    const g = buildGmailMap([{ from: "amir@x.com", to: ["hamdanhamzeh0@gmail.com"], date: "2026-05-01T00:00:00Z", subject: "?", mailbox: "inbox" }], NOW); // ~71d ago
    expect(state(c({}), g, {}, db(), NOW).oweReply).toBe(false);
  });
  it("calNext is the soonest upcoming meeting", () => {
    const cal = buildCalMap([{ summary: "future", start: "2026-08-01T00:00:00Z", attendees: [{ email: "amir@x.com" }] }], NOW);
    expect(state(c({}), {}, cal, db(), NOW).calNext).toBe("2026-08-01T00:00:00Z");
  });
  it("per-contact cadenceDays overrides the tier cadence", () => {
    expect(state(c({ cadenceDays: 10 }), {}, {}, db(), NOW).cad).toBe(10);
  });
  it("cadence falls back to 90 when the tier is unknown", () => {
    expect(state(c({ tier: "ghost" }), {}, {}, db(), NOW).cad).toBe(90);
  });
});
