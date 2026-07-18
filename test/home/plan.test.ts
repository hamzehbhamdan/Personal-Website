import { describe, it, expect } from "vitest";
import { computeOpenBlocks, fmtBlock } from "@/lib/dashboard/home/plan";

// TZ is pinned to UTC in vitest.config, so `new Date(y,m,d,h)` (local) == the ISO "Z" values below.
const at = (h: number, m = 0) => `2026-07-17T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00Z`;

describe("computeOpenBlocks", () => {
  it("returns one block spanning now→21:00 when there are no events", () => {
    const blocks = computeOpenBlocks([], new Date(2026, 6, 17, 9, 0, 0));
    expect(blocks).toHaveLength(1);
    expect(blocks[0].mins).toBe(12 * 60); // 09:00 → 21:00
  });

  it("subtracts a timed event, leaving gaps around it", () => {
    const blocks = computeOpenBlocks([{ start: at(10), end: at(11) }], new Date(2026, 6, 17, 9, 0, 0));
    expect(blocks.map((b) => b.mins)).toEqual([60, 600]); // 9–10 and 11–21
  });

  it("ignores all-day (date-only) events", () => {
    const blocks = computeOpenBlocks([{ start: "2026-07-17", end: "2026-07-18" }], new Date(2026, 6, 17, 9, 0, 0));
    expect(blocks).toHaveLength(1);
    expect(blocks[0].mins).toBe(12 * 60);
  });

  it("drops gaps shorter than 30 minutes", () => {
    // busy 09:15 → 21:00 leaves only a 15-min gap up front → dropped
    const blocks = computeOpenBlocks([{ start: at(9, 15), end: at(21) }], new Date(2026, 6, 17, 9, 0, 0));
    expect(blocks).toHaveLength(0);
  });

  it("merges overlapping events before subtracting", () => {
    const blocks = computeOpenBlocks(
      [
        { start: at(10), end: at(12) },
        { start: at(11), end: at(13) },
      ],
      new Date(2026, 6, 17, 9, 0, 0),
    );
    expect(blocks.map((b) => b.mins)).toEqual([60, 480]); // 9–10, then 13–21
  });

  it("returns nothing once the working day is over", () => {
    expect(computeOpenBlocks([], new Date(2026, 6, 17, 21, 30, 0))).toHaveLength(0);
  });
});

describe("fmtBlock", () => {
  it("renders a readable duration suffix", () => {
    const [b] = computeOpenBlocks([{ start: at(10, 30), end: at(21) }], new Date(2026, 6, 17, 9, 0, 0));
    expect(fmtBlock(b)).toContain("1h 30m"); // 09:00 → 10:30
  });
});
