import { describe, it, expect } from "vitest";
import { emptyCoachDB, normalize } from "../../lib/dashboard/coach/seed";

describe("coach seed", () => {
  it("emptyCoachDB is a valid v4 shell", () => {
    const db = emptyCoachDB();
    expect(db.version).toBe(4);
    expect(db.goals).toEqual([]);
    expect(db.tasks).toEqual([]);
    expect(db.matters).toBe("");
    expect(db.weekPlan).toEqual({});
  });
  it("normalize backfills missing fields on a partial doc", () => {
    const db = normalize({ goals: [{ id: "g1", horizon: "week", period: "W", title: "x" }] } as any);
    expect(Array.isArray(db.tasks)).toBe(true);
    expect(db.matters).toBe("");
    expect(db.intakeDone).toEqual({});
    expect(db.goals[0].recurring).toBe(false);
    expect(db.goals[0].useManual).toBe(false);
    expect(db.goals[0].manualProgress).toBe(0);
  });
});
