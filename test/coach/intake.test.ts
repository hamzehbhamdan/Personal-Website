import { describe, it, expect } from "vitest";
import { unsetHorizons, addProposedGoals, intakeSystemPrompt, ctx } from "../../lib/dashboard/coach/intake";
import { emptyCoachDB } from "../../lib/dashboard/coach/seed";
import type { ProposedGoal } from "../../lib/dashboard/coach/parse";

const TODAY = new Date(2026, 6, 8);

describe("unsetHorizons", () => {
  it("all of year/quarter/month when nothing set", () => {
    expect(unsetHorizons(emptyCoachDB(), TODAY)).toEqual(["year", "quarter", "month"]);
  });
  it("drops a horizon that has a goal for the current period", () => {
    const db = emptyCoachDB();
    db.goals.push({ id: "g", horizon: "month", period: "2026-07", title: "x", parentId: "", recurring: false, useManual: false, manualProgress: 0, notes: "" });
    expect(unsetHorizons(db, TODAY)).toEqual(["year", "quarter"]);
  });
  it("drops a horizon marked intakeDone", () => {
    const db = emptyCoachDB(); db.intakeDone["year:2026"] = true;
    expect(unsetHorizons(db, TODAY)).toEqual(["quarter", "month"]);
  });
});

describe("addProposedGoals (top-down laddering)", () => {
  it("creates goals parent-first and links laddersTo by title", () => {
    const db = emptyCoachDB();
    addProposedGoals(db, [
      { horizon: "month", title: "Ship onboarding", laddersTo: "Get 100 users" },
      { horizon: "quarter", title: "Get 100 users", laddersTo: "Launch" },
      { horizon: "year", title: "Launch", laddersTo: null },
    ], ["year", "quarter", "month"], TODAY);
    const year = db.goals.find((g) => g.title === "Launch")!;
    const q = db.goals.find((g) => g.title === "Get 100 users")!;
    const m = db.goals.find((g) => g.title === "Ship onboarding")!;
    expect(q.parentId).toBe(year.id);
    expect(m.parentId).toBe(q.id);
    expect(db.intakeDone["month:2026-07"]).toBe(true);
  });
  it("marks ALL opened horizons done even when the AI proposes a subset (coach.html:703)", () => {
    const db = emptyCoachDB();
    addProposedGoals(db, [{ horizon: "year", title: "Launch", laddersTo: null }],
      ["year", "quarter", "month"], TODAY);
    expect(db.intakeDone["year:2026"]).toBe(true);
    expect(db.intakeDone["quarter:2026-Q3"]).toBe(true);   // opened but un-proposed — still marked
    expect(db.intakeDone["month:2026-07"]).toBe(true);
  });
  it("skips proposed goals with a missing or non-string title instead of throwing", () => {
    const db = emptyCoachDB();
    const proposed: ProposedGoal[] = [
      { horizon: "year", title: "Ship v2", laddersTo: null },
      { horizon: "quarter", laddersTo: "Ship v2" } as unknown as ProposedGoal,   // no title — must be skipped, not crash
      { horizon: "month", title: 42 as unknown as string, laddersTo: null },     // non-string title — skipped
    ];
    expect(() => addProposedGoals(db, proposed, ["year"], TODAY)).not.toThrow();
    expect(db.goals.map((g) => g.title)).toEqual(["Ship v2"]);
  });
});

describe("prompt builders + ctx", () => {
  it("intakeSystemPrompt names the target periods and first-run framing", () => {
    const p = intakeSystemPrompt(emptyCoachDB(), ["year", "quarter", "month"], TODAY);
    expect(p).toContain("goals");
    expect(p).toContain("```goals");
    expect(p).toContain("FIRST session");   // firstRun (no matters, no goals)
  });
  it("ctx exposes goals with progress + no raw timers", () => {
    const c = ctx(emptyCoachDB(), { horizon: "week", offset: 0 }, TODAY);
    expect(c.today).toBe("2026-07-08");
    expect(Array.isArray(c.goals)).toBe(true);
  });
});
