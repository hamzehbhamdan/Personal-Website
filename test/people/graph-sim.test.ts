import { describe, it, expect } from "vitest";
import {
  step,
  seedPositions,
  createSettleTracker,
  SETTLE_EPS,
  type SimNode,
} from "@/lib/dashboard/people/graph-sim";

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

  it("returns the total distance unpinned nodes moved this step", () => {
    const nodes: SimNode[] = [
      { id: "a", x: 0, y: 200, vx: 0, vy: 0 },
      { id: "b", x: 400, y: 200, vx: 0, vy: 0 },
    ];
    const before = nodes.map((n) => ({ x: n.x, y: n.y }));
    const disp = step(nodes, [{ a: "a", b: "b" }], OPTS);
    const moved = nodes.reduce(
      (s, n, i) => s + Math.hypot(n.x - before[i].x, n.y - before[i].y),
      0,
    );
    expect(disp).toBeCloseTo(moved, 6);
    expect(disp).toBeGreaterThan(0);
  });

  it("pinned nodes contribute zero displacement", () => {
    const nodes: SimNode[] = [
      { id: "a", x: 50, y: 50, vx: 0, vy: 0, pinned: true },
      { id: "b", x: 400, y: 400, vx: 0, vy: 0, pinned: true },
    ];
    expect(step(nodes, [{ a: "a", b: "b" }], OPTS)).toBe(0);
  });
});

describe("graph-sim convergence", () => {
  // NetworkPanel's live loop uses friction 0.92 — pin convergence at that value.
  const LIVE = { centerX: 200, centerY: 200, friction: 0.92 };
  const EDGES = [
    { a: "a", b: "b" },
    { a: "b", b: "c" },
    { a: "c", b: "d" },
    { a: "a", b: "e" },
  ];

  it("a small graph settles within 400 steps and stays below SETTLE_EPS after", () => {
    const nodes = seedPositions(["a", "b", "c", "d", "e"], 200, 200);
    const tracker = createSettleTracker();
    let settledAt = -1;
    for (let i = 0; i < 400 && settledAt < 0; i++) {
      if (tracker.update(step(nodes, EDGES, LIVE), nodes.length)) settledAt = i;
    }
    // Simulated: this graph settles at step 168 with the default eps/frames.
    expect(settledAt).toBeGreaterThan(-1);
    expect(settledAt).toBeLessThan(400);
    // ...and stays settled: post-settle per-node displacement never re-exceeds
    // SETTLE_EPS (simulated max over the next 2000 steps ≈ 5.2e-3).
    for (let i = 0; i < 200; i++) {
      expect(step(nodes, EDGES, LIVE) / nodes.length).toBeLessThan(SETTLE_EPS);
    }
  });

  it("displacement is oscillatory: one calm frame is not settled", () => {
    // A single node under center gravity is an underdamped oscillator: its
    // displacement passes through ~0 at each velocity zero-crossing long
    // before the swing dies out. Guards the consecutive-frames requirement.
    const nodes = seedPositions(["solo"], 200, 200);
    let firstCalm = -1;
    let calmThenLoud = false;
    for (let i = 0; i < 400; i++) {
      const perNode = step(nodes, [], LIVE) / nodes.length;
      if (firstCalm < 0 && perNode < SETTLE_EPS) firstCalm = i;
      else if (firstCalm >= 0 && perNode >= SETTLE_EPS) calmThenLoud = true;
    }
    expect(firstCalm).toBeGreaterThan(-1);
    expect(calmThenLoud).toBe(true); // simulated: dips at step 52, re-exceeds by 137
  });
});

describe("createSettleTracker", () => {
  it("settles only after `frames` consecutive calm updates", () => {
    const t = createSettleTracker(0.02, 3);
    expect(t.update(0.01, 1)).toBe(false);
    expect(t.update(0.01, 1)).toBe(false);
    expect(t.update(0.01, 1)).toBe(true);
    expect(t.settled()).toBe(true);
  });

  it("a loud frame resets the calm streak", () => {
    const t = createSettleTracker(0.02, 3);
    t.update(0.01, 1);
    t.update(0.01, 1);
    t.update(5, 1); // burst of motion
    expect(t.settled()).toBe(false);
    t.update(0.01, 1);
    t.update(0.01, 1);
    expect(t.update(0.01, 1)).toBe(true);
  });

  it("reset() clears the streak (wake semantics)", () => {
    const t = createSettleTracker(0.02, 2);
    t.update(0.01, 1);
    t.update(0.01, 1);
    expect(t.settled()).toBe(true);
    t.reset();
    expect(t.settled()).toBe(false);
  });

  it("treats an empty graph as calm", () => {
    const t = createSettleTracker(0.02, 2);
    t.update(0, 0);
    expect(t.update(0, 0)).toBe(true);
  });

  it("compares per-node displacement, not the raw total", () => {
    const calm = createSettleTracker(0.02, 1);
    expect(calm.update(1.9, 100)).toBe(true); // 0.019 px/node — calm
    const loud = createSettleTracker(0.02, 1);
    expect(loud.update(3, 100)).toBe(false); // 0.03 px/node — still moving
  });
});
