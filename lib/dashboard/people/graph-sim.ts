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

/**
 * One physics iteration of a hand-rolled force-directed layout (ported from the
 * old NetworkGraph): all-pairs repulsion capped at 300px, spring attraction per
 * edge toward a ~100px rest length, and center gravity — then integrate with
 * friction. Mutates `nodes` in place. Pinned nodes are held fixed.
 */
export function step(nodes: SimNode[], edges: Edge[], opts: StepOpts): void {
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

  // 3. Center gravity + integrate
  for (const n of nodes) {
    if (n.pinned) { n.vx = 0; n.vy = 0; continue; }
    n.vx += (centerX - n.x) * 0.005;
    n.vy += (centerY - n.y) * 0.005;
    n.x += n.vx;
    n.y += n.vy;
    n.vx *= friction;
    n.vy *= friction;
  }
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
