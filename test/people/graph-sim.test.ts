import { describe, it, expect } from "vitest";
import { step, type SimNode } from "../../lib/dashboard/people/graph-sim";

const dist = (a: SimNode, b: SimNode) => Math.hypot(a.x - b.x, a.y - b.y);
const OPTS = { centerX: 200, centerY: 200, friction: 0.9 };

describe("graph-sim step", () => {
  it("springs pull a connected pair toward the rest length (~100)", () => {
    const nodes: SimNode[] = [
      { id: "a", x: 0, y: 200, vx: 0, vy: 0 },
      { id: "b", x: 400, y: 200, vx: 0, vy: 0 },
    ];
    for (let i = 0; i < 500; i++) step(nodes, [{ a: "a", b: "b" }], OPTS);
    const d = dist(nodes[0], nodes[1]);
    expect(d).toBeGreaterThan(60);
    expect(d).toBeLessThan(170);
  });

  it("repulsion separates an overlapping unconnected pair", () => {
    const nodes: SimNode[] = [
      { id: "a", x: 200, y: 200, vx: 0, vy: 0 },
      { id: "b", x: 205, y: 200, vx: 0, vy: 0 },
    ];
    const before = dist(nodes[0], nodes[1]);
    for (let i = 0; i < 50; i++) step(nodes, [], OPTS);
    expect(dist(nodes[0], nodes[1])).toBeGreaterThan(before);
  });

  it("holds a pinned node fixed", () => {
    const nodes: SimNode[] = [
      { id: "a", x: 50, y: 50, vx: 0, vy: 0, pinned: true },
      { id: "b", x: 400, y: 400, vx: 0, vy: 0 },
    ];
    for (let i = 0; i < 30; i++) step(nodes, [{ a: "a", b: "b" }], OPTS);
    expect(nodes[0].x).toBe(50);
    expect(nodes[0].y).toBe(50);
  });
});
