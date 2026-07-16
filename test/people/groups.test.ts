import { describe, it, expect } from "vitest";
import { matchesRule, membersOf, groupsForContact, groupState } from "@/lib/dashboard/people/groups";
import type { CrmDB } from "@/lib/dashboard/people/types";

const NOW = new Date("2026-07-11T12:00:00Z");
const db = (): CrmDB => ({
  version: 1, dismissed: [], settings: { autoTags: false },
  tiers: [{ name: "Inner circle", cadenceDays: 21, color: "#000" }, { name: "College", cadenceDays: 45, color: "#000" }],
  contacts: [
    { id: "a@x.com", name: "Amir", emails: ["a@x.com"], tier: "College", tags: ["college", "gym"], cadenceDays: 45, lastTouch: "2026-01-01T00:00:00Z", snoozeUntil: null, log: [] },
    { id: "b@y.com", name: "Bex", emails: ["b@y.com"], tier: "Inner circle", tags: ["college"], cadenceDays: 21, lastTouch: null, snoozeUntil: null, log: [] },
  ],
  groups: [
    { id: "grp-1", name: "College crew", type: "smart", rule: { kind: "tag", value: "college" }, members: [], cadenceDays: 90, lastTouch: "2026-01-01T00:00:00Z", snoozeUntil: null },
    { id: "grp-2", name: "Manual VIP", type: "manual", rule: null, members: ["b@y.com"], cadenceDays: 30, lastTouch: null, snoozeUntil: null },
  ],
});
const overdueAll = () => true;

describe("groups", () => {
  it("tag rule matches both college contacts (harness parity: crmseed2 → 2 people)", () => {
    const d = db();
    expect(membersOf(d, d.groups[0], overdueAll)).toEqual(["a@x.com", "b@y.com"]);
  });
  it("tier rule matches by tier; all matches everyone; overdue defers to injected predicate", () => {
    const d = db();
    expect(matchesRule(d.contacts[0], { kind: "tier", value: "College" }, overdueAll)).toBe(true);
    expect(matchesRule(d.contacts[1], { kind: "all", value: null }, overdueAll)).toBe(true);
    expect(matchesRule(d.contacts[0], { kind: "overdue", value: null }, () => false)).toBe(false);
  });
  it("manual membership is the members array", () => {
    const d = db();
    expect(membersOf(d, d.groups[1], overdueAll)).toEqual(["b@y.com"]);
  });
  it("groupsForContact returns smart+manual matches", () => {
    const d = db();
    expect(groupsForContact(d, "b@y.com", overdueAll).map((g) => g.id).sort()).toEqual(["grp-1", "grp-2"]);
  });
  it("groupState: overdue when past cadence and not snoozed", () => {
    const d = db();
    expect(groupState(d.groups[0], NOW).overdue).toBe(true); // last 2026-01-01, cad 90
  });
});
