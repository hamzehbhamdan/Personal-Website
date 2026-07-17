import { describe, it, expect } from "vitest";
import { higherPace, weekPace } from "../../lib/dashboard/coach/pace";

describe("higherPace", () => {
  it("complete at >=100", () => expect(higherPace(100, 30).kind).toBe("done"));
  it("on pace when overall >= elapsed-12", () => {
    expect(higherPace(40, 50).kind).toBe("on");       // 40 >= 50-12
  });
  it("behind pace reports the gap", () => {
    const p = higherPace(20, 50);
    expect(p.kind).toBe("behind"); expect(p.text).toBe("30% behind pace");
  });
  it("no read-out when not current period", () => expect(higherPace(20, 50, false).kind).toBe("none"));
  it("no read-out with zero goals", () => expect(higherPace(0, 50, true, 0).kind).toBe("none"));
});

describe("weekPace", () => {
  it("empty week -> not started", () => expect(weekPace({ isEmpty: true, total: 0, done: 0 }).text).toBe("not started"));
  it("shows pts read-out", () => {
    const p = weekPace({ isEmpty: false, total: 8, done: 5 });
    expect(p.pct).toBe("63%"); expect(p.text).toBe("5 / 8 pts");
  });
});
