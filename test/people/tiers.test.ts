// test/people/tiers.test.ts
import { describe, it, expect } from "vitest";
import { migrateTiers, tierCad, tierColor, tierNames, DEFAULT_TIERS } from "@/lib/dashboard/people/tiers";
import type { CrmDB } from "@/lib/dashboard/people/types";

const base = (): CrmDB => ({
  version: 1, dismissed: [], connections: [], settings: { autoTags: false },
  tiers: [{ name: "Inner circle", cadenceDays: 21, color: "#bf6129" }, { name: "College", cadenceDays: 45, color: "#6d7740" }],
  contacts: [
    { id: "a", name: "A", emails: [], tier: "College", tags: [], lastTouch: null, snoozeUntil: null, log: [] },
    { id: "b", name: "B", emails: [], tier: "Inner circle", tags: [], lastTouch: null, snoozeUntil: null, log: [] },
  ],
  groups: [{ id: "g", name: "G", type: "smart", rule: { kind: "tier", value: "College" }, members: [], cadenceDays: 90, lastTouch: null, snoozeUntil: null }],
});

describe("tiers", () => {
  it("DEFAULT_TIERS has the five ported tiers", () => expect(tierNames({ tiers: DEFAULT_TIERS } as CrmDB)).toEqual(["Inner circle","Family","Friends","Mentors","Professional"]));
  it("tierCad/tierColor fall back when tier missing", () => {
    const db = base();
    expect(tierCad(db, "College")).toBe(45);
    expect(tierCad(db, "ghost")).toBe(90);
    expect(tierColor(db, "ghost")).toBe("#8c8472");
  });
  it("rename migrates contacts AND smart-group tier rules", () => {
    const db = migrateTiers(base(), [{ orig: "College", name: "Uni", cad: 50 }, { orig: "Inner circle", name: "Inner circle", cad: 21 }]);
    expect(db.contacts.find((c) => c.id === "a")!.tier).toBe("Uni");
    expect(db.groups[0].rule!.value).toBe("Uni");
    expect(tierCad(db, "Uni")).toBe(50);
  });
  it("delete reassigns orphaned contacts + rules to the first tier", () => {
    const db = migrateTiers(base(), [{ orig: "Inner circle", name: "Inner circle", cad: 21 }]); // College removed
    expect(db.contacts.find((c) => c.id === "a")!.tier).toBe("Inner circle");
    expect(db.groups[0].rule!.value).toBe("Inner circle");
  });
  it("preserves an existing tier's color; assigns from PALETTE for new tiers", () => {
    const db = migrateTiers(base(), [{ orig: "Inner circle", name: "Inner circle", cad: 21 }, { orig: "", name: "New", cad: 90 }]);
    expect(db.tiers[0].color).toBe("#bf6129");
    expect(db.tiers[1].color).toMatch(/^#/);
  });
  it("no valid rows → returns db unchanged", () => {
    const db = base(); expect(migrateTiers(db, [{ orig: "College", name: "", cad: 45 }, { orig: "Inner circle", name: "", cad: 21 }])).toBe(db);
  });
});
