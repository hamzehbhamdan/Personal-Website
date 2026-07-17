import { describe, it, expect } from "vitest";
import { periodRange, elapsedFrac, periodLabelOf, findOffset, NEXTUP, NEXTDOWN } from "../../lib/dashboard/coach/periods";

const TODAY = new Date(2026, 6, 8); // Wed Jul 8 2026 (local, UTC-pinned in CI)

describe("periodRange", () => {
  it("week: Monday-anchored key + span label", () => {
    const r = periodRange("week", 0, TODAY);
    expect(r.key).toBe("W2026-07-06");                 // Monday Jul 6
    expect(r.label).toBe("Jul 6 – Jul 12");
  });
  it("week offset shifts by 7 days", () => {
    expect(periodRange("week", -1, TODAY).key).toBe("W2026-06-29");
    expect(periodRange("week", 1, TODAY).key).toBe("W2026-07-13");
  });
  it("month/quarter/year keys + labels", () => {
    expect(periodRange("month", 0, TODAY).key).toBe("2026-07");
    expect(periodRange("month", 0, TODAY).label).toBe("July 2026");
    expect(periodRange("quarter", 0, TODAY).key).toBe("2026-Q3");
    expect(periodRange("quarter", 0, TODAY).label).toBe("Q3 2026");
    expect(periodRange("year", 0, TODAY).key).toBe("2026");
  });
});

describe("elapsedFrac", () => {
  it("0 before start, 1 after end, mid within", () => {
    const yr = periodRange("year", 0, TODAY);
    expect(elapsedFrac(yr, new Date(2025, 0, 1))).toBe(0);
    expect(elapsedFrac(yr, new Date(2027, 0, 1))).toBe(1);
    const f = elapsedFrac(yr, TODAY);
    expect(f).toBeGreaterThan(0.4); expect(f).toBeLessThan(0.6);
  });
});

describe("periodLabelOf / findOffset / ladders", () => {
  it("labels a stored goal period key", () => {
    expect(periodLabelOf({ period: "2026-Q3" } as any)).toBe("Q3 2026");
    expect(periodLabelOf({ period: "2026-07" } as any)).toBe("Jul 2026");
    expect(periodLabelOf({ period: "2026" } as any)).toBe("2026");
  });
  it("findOffset round-trips a key", () => {
    const k = periodRange("month", 2, TODAY).key;
    expect(findOffset("month", k, TODAY)).toBe(2);
  });
  it("ladder maps", () => {
    expect(NEXTUP.week).toBe("month"); expect(NEXTUP.year).toBe(null);
    expect(NEXTDOWN.year).toBe("quarter"); expect(NEXTDOWN.week).toBe(null);
  });
});
