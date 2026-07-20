import { describe, it, expect } from "vitest";
import { msUntilNextLocalMidnight } from "@/lib/dashboard/useToday";

describe("msUntilNextLocalMidnight", () => {
  it("measures to the next local midnight plus a 1s safety margin", () => {
    const now = new Date(2026, 6, 8, 23, 0, 0); // 23:00 local
    expect(msUntilNextLocalMidnight(now)).toBe(60 * 60_000 + 1000);
  });
  it("exactly at midnight targets the NEXT midnight", () => {
    const atMidnight = new Date(2026, 6, 9, 0, 0, 0);
    expect(msUntilNextLocalMidnight(atMidnight)).toBe(24 * 3_600_000 + 1000);
  });
  it("just before midnight still fires strictly after the boundary", () => {
    const justBefore = new Date(2026, 6, 8, 23, 59, 59, 900);
    expect(msUntilNextLocalMidnight(justBefore)).toBe(1100); // 100ms + 1s margin
  });
});
