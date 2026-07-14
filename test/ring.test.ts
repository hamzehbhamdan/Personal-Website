import { describe, it, expect } from "vitest";
import { ringGeometry } from "../lib/dashboard/ring";

describe("ringGeometry", () => {
  it("clamps pct to 0..100", () => {
    expect(ringGeometry(-5, 40).offset).toBeCloseTo(ringGeometry(0, 40).offset);
    expect(ringGeometry(150, 40).offset).toBeCloseTo(ringGeometry(100, 40).offset);
  });
  it("full circle at 0%, no offset at 100%", () => {
    const zero = ringGeometry(0, 40);
    expect(zero.offset).toBeCloseTo(zero.circumference, 3);
    expect(ringGeometry(100, 40).offset).toBeCloseTo(0, 3);
  });
});
