import type { Edge } from "./types";

export interface SimNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  pinned?: boolean; // held fixed while dragged
}

export interface StepOpts {
  centerX: number;
  centerY: number;
  friction: number;
}

/** Average per-node movement (px per frame) below which a frame counts as calm. */
export const SETTLE_EPS = 0.02;

/**
 * Consecutive calm frames required before the layout counts as settled. The sim
 * is underdamped: per-node displacement dips through ~0 at every velocity
 * zero-crossing while the layout is still visibly swinging, so a single calm
 * frame must not put the loop to sleep.
 */
export const SETTLE_FRAMES = 30;

export interface SettleTracker {
  /** Record one frame's total displacement. Returns true once settled. */
  update(totalDisplacement: number, nodeCount: number): boolean;
  /** True when the last `frames` consecutive updates were all calm. */
  settled(): boolean;
  /** Clear the calm streak — call whenever something disturbs the layout. */
  reset(): void;
}

/**
 * Convergence detector for the relaxation loop: feed it step()'s returned
 * displacement each frame and stop scheduling frames once it reports settled.
 * An empty graph (nodeCount 0) counts as calm so the loop can sleep.
 */
export function createSettleTracker(
  eps: number = SETTLE_EPS,
  frames: number = SETTLE_FRAMES,
): SettleTracker {
  let calm = 0;
  return {
    update(totalDisplacement, nodeCount) {
      const perNode = nodeCount > 0 ? totalDisplacement / nodeCount : 0;
      if (perNode < eps) calm += 1;
      else calm = 0;
      return calm >= frames;
    },
    settled: () => calm >= frames,
    reset() {
      calm = 0;
    },
  };
}

/**
 * One physics iteration of a hand-rolled force-directed layout (ported from the
 * old NetworkGraph): all-pairs repulsion capped at 300px, spring attraction per
 * edge toward a ~100px rest length, and center gravity — then integrate with
 * friction. Mutates `nodes` in place. Pinned nodes are held fixed.
 *
 * Returns the total distance (px) unpinned nodes moved this step, so callers
 * can detect convergence (see createSettleTracker) instead of stepping forever.
 */
export function step(nodes: SimNode[], edges: Edge[], opts: StepOpts): number {
  const { centerX, centerY, friction } = opts;

  // 1. Repulsion (all pairs within 300px)
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      const dx = a.x - b.x, dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      if (dist < 300) {
        const f = (300 - dist) * 0.01;
        const nx = dx / dist, ny = dy / dist;
        if (!a.pinned) { a.vx += nx * f; a.vy += ny * f; }
        if (!b.pinned) { b.vx -= nx * f; b.vy -= ny * f; }
      }
    }
  }

  // 2. Attraction (springs, rest length 100)
  const byId = new Map(nodes.map((n) => [n.id, n]));
  for (const e of edges) {
    const s = byId.get(e.a), t = byId.get(e.b);
    if (!s || !t) continue;
    const dx = s.x - t.x, dy = s.y - t.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const f = (dist - 100) * 0.02;
    const nx = dx / dist, ny = dy / dist;
    if (!s.pinned) { s.vx -= nx * f; s.vy -= ny * f; }
    if (!t.pinned) { t.vx += nx * f; t.vy += ny * f; }
  }

  // 3. Center gravity + integrate; accumulate how far everything moved.
  let displacement = 0;
  for (const n of nodes) {
    if (n.pinned) { n.vx = 0; n.vy = 0; continue; }
    n.vx += (centerX - n.x) * 0.005;
    n.vy += (centerY - n.y) * 0.005;
    n.x += n.vx;
    n.y += n.vy;
    displacement += Math.hypot(n.vx, n.vy); // x/y just moved by exactly (vx, vy)
    n.vx *= friction;
    n.vy *= friction;
  }
  return displacement;
}

/** Deterministic-ish initial spread so a fresh layout doesn't overlap at origin.
 *  Uses index-based angles (no Math.random, which is unavailable in some runtimes). */
export function seedPositions(ids: string[], centerX: number, centerY: number, radius = 220): SimNode[] {
  const n = Math.max(ids.length, 1);
  return ids.map((id, i) => {
    const ang = (i / n) * Math.PI * 2;
    const r = radius * (0.35 + 0.65 * ((i % 5) / 4));
    return { id, x: centerX + Math.cos(ang) * r, y: centerY + Math.sin(ang) * r, vx: 0, vy: 0 };
  });
}
