import { describe, it, expect } from "vitest";
import { pushModalLayer, popModalLayer, isTopModalLayer } from "@/components/dashboard/ui/Modal";

describe("modal LIFO stack", () => {
  it("the most recently pushed layer is topmost", () => {
    const a = pushModalLayer();
    const b = pushModalLayer();
    expect(isTopModalLayer(a)).toBe(false);
    expect(isTopModalLayer(b)).toBe(true);
    popModalLayer(b);
    popModalLayer(a);
  });

  it("popping the top layer restores the layer below as topmost", () => {
    const a = pushModalLayer();
    const b = pushModalLayer();
    popModalLayer(b);
    expect(isTopModalLayer(a)).toBe(true);
    popModalLayer(a);
  });

  it("popping a non-top layer preserves stack integrity for the remaining layers", () => {
    const a = pushModalLayer();
    const b = pushModalLayer();
    const c = pushModalLayer();
    popModalLayer(a); // remove from the middle-ish (bottom), not the top
    expect(isTopModalLayer(c)).toBe(true);
    expect(isTopModalLayer(b)).toBe(false);
    popModalLayer(c);
    expect(isTopModalLayer(b)).toBe(true);
    popModalLayer(b);
  });

  it("an empty or absent id is never topmost", () => {
    const absent = Symbol("absent");
    expect(isTopModalLayer(absent)).toBe(false);
    const a = pushModalLayer();
    expect(isTopModalLayer(absent)).toBe(false);
    popModalLayer(a);
    expect(isTopModalLayer(a)).toBe(false); // stack now empty
  });
});
