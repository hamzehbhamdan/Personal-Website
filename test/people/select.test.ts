import { describe, it, expect } from "vitest";
import { allTags, summaryCounts, attentionList, filterSortContacts } from "@/lib/dashboard/people/select";
import { buildSuggestions } from "@/lib/dashboard/people/suggestions";
import { state } from "@/lib/dashboard/people/state";
import { groupState } from "@/lib/dashboard/people/groups";
import { buildGmailMap } from "@/lib/dashboard/people/interactions";
import type { CrmDB } from "@/lib/dashboard/people/types";

const NOW = new Date("2026-07-11T12:00:00Z");
const db = (): CrmDB => ({
  version: 1, dismissed: [], settings: { autoTags: false },
  tiers: [{ name: "Friends", cadenceDays: 60, color: "#000" }, { name: "Inner circle", cadenceDays: 21, color: "#000" }],
  contacts: [
    { id: "a@x.com", name: "Amir Khan", emails: ["a@x.com"], phone: "+1", tier: "Friends", cadenceDays: 60, tags: ["hiking"], notes: "loves hiking", lastTouch: "2026-03-01T00:00:00Z", snoozeUntil: null, log: [] },
    { id: "b@y.com", name: "Bex Lee", emails: ["b@y.com"], tier: "Inner circle", cadenceDays: 21, tags: [], notes: "", lastTouch: null, snoozeUntil: null, log: [] },
  ],
  groups: [{ id: "grp-1", name: "Quarterly life update", type: "manual", rule: null, members: ["a@x.com", "b@y.com"], cadenceDays: 90, lastTouch: "2026-01-15T00:00:00Z", snoozeUntil: null }],
});
const so = (d: CrmDB) => (c: any) => state(c, {}, {}, d, NOW);

describe("selectors", () => {
  it("allTags is sorted unique", () => expect(allTags(db())).toEqual(["hiking"]));
  it("summary counts overdue/owe/bday", () => {
    const c = summaryCounts(db(), so(db()));
    expect(c.overdue).toBe(2); expect(c.owe).toBe(0); expect(c.bdays).toBe(0);
  });
  it("attention list surfaces both overdue contacts + overdue group", () => {
    const d = db();
    const a = attentionList(d, so(d), (g) => groupState(g, NOW).overdue);
    expect(a.contacts.length).toBe(2); expect(a.groups.length).toBe(1);
  });
  it("filter/sort: search narrows, overdue sort puts null-days first", () => {
    const d = db();
    const r = filterSortContacts(d, so(d), { tier: "all", tag: "all", sort: "overdue", q: "" });
    expect(r.map((x) => x.c.name)).toContain("Amir Khan");
    const q = filterSortContacts(d, so(d), { tier: "all", tag: "all", sort: "name", q: "hiking" });
    expect(q.length).toBe(1); expect(q[0].c.name).toBe("Amir Khan");
  });
  it("suggestions exclude known + dismissed, sort by score, cap 25", () => {
    const g = buildGmailMap([
      { from: "new.person@corp.com", to: ["hamdanhamzeh0@gmail.com"], date: "2026-06-01T00:00:00Z", subject: "s", mailbox: "inbox" },
      { from: "a@x.com", to: ["hamdanhamzeh0@gmail.com"], date: "2026-06-01T00:00:00Z", subject: "known", mailbox: "inbox" },
    ], NOW);
    const s = buildSuggestions(db(), g, {});
    expect(s.map((x) => x.email)).toEqual(["new.person@corp.com"]);
  });
});
