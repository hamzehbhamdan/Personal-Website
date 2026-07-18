import type { Edge } from "./types";

/** Canonical undirected edge (a < b), or null for a self-loop. */
export function canonEdge(a: string, b: string): Edge | null {
  if (!a || !b || a === b) return null;
  return a < b ? { a, b } : { a: b, b: a };
}

export function edgeKey(e: Edge): string {
  return e.a < e.b ? `${e.a}|${e.b}` : `${e.b}|${e.a}`;
}

export function hasEdge(edges: Edge[], a: string, b: string): boolean {
  const e = canonEdge(a, b);
  if (!e) return false;
  const k = edgeKey(e);
  return edges.some((x) => edgeKey(x) === k);
}

/** Add an edge (canonical, idempotent). Self-loops are ignored. */
export function addEdge(edges: Edge[], a: string, b: string): Edge[] {
  const e = canonEdge(a, b);
  if (!e || hasEdge(edges, a, b)) return edges;
  return [...edges, e];
}

export function removeEdge(edges: Edge[], a: string, b: string): Edge[] {
  const e = canonEdge(a, b);
  if (!e) return edges;
  const k = edgeKey(e);
  return edges.filter((x) => edgeKey(x) !== k);
}

/** All pairwise canonical edges among distinct ids (n·(n-1)/2). */
export function cliqueEdges(ids: string[]): Edge[] {
  const uniq = [...new Set(ids)];
  const out: Edge[] = [];
  for (let i = 0; i < uniq.length; i++) {
    for (let j = i + 1; j < uniq.length; j++) {
      const e = canonEdge(uniq[i], uniq[j]);
      if (e) out.push(e);
    }
  }
  return out;
}

/** Idempotent union of the existing edges with the clique over `ids`. */
export function mergeClique(edges: Edge[], ids: string[]): Edge[] {
  const seen = new Set(edges.map(edgeKey));
  const out = [...edges];
  for (const e of cliqueEdges(ids)) {
    const k = edgeKey(e);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(e);
    }
  }
  return out;
}

/** Fewest-hops path (inclusive of both endpoints) between two contacts via BFS,
 *  or null if they aren't connected. `[from]` when from === to. */
export function shortestPath(edges: Edge[], from: string, to: string): string[] | null {
  if (from === to) return [from];
  const adj = new Map<string, string[]>();
  const link = (x: string, y: string) => {
    const arr = adj.get(x);
    if (arr) arr.push(y);
    else adj.set(x, [y]);
  };
  for (const e of edges) {
    link(e.a, e.b);
    link(e.b, e.a);
  }
  if (!adj.has(from) || !adj.has(to)) return null;
  const parent = new Map<string, string | null>([[from, null]]);
  const queue: string[] = [from];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === to) break;
    for (const nb of adj.get(cur) ?? []) {
      if (!parent.has(nb)) {
        parent.set(nb, cur);
        queue.push(nb);
      }
    }
  }
  if (!parent.has(to)) return null;
  const path: string[] = [];
  let node: string | null = to;
  while (node != null) {
    path.push(node);
    node = parent.get(node) ?? null;
  }
  return path.reverse();
}

export function neighbors(edges: Edge[], id: string): string[] {
  const out: string[] = [];
  for (const e of edges) {
    if (e.a === id) out.push(e.b);
    else if (e.b === id) out.push(e.a);
  }
  return out;
}

/** Sanitize a raw edges array: canonicalize, drop self-loops, drop edges whose
 *  endpoints aren't current contacts, and dedup. Used by normalizeDb. */
export function pruneEdges(edges: unknown, contactIds: Set<string>): Edge[] {
  if (!Array.isArray(edges)) return [];
  const seen = new Set<string>();
  const out: Edge[] = [];
  for (const raw of edges) {
    if (!raw || typeof raw !== "object") continue;
    const rr = raw as { a?: unknown; b?: unknown };
    const e = canonEdge(String(rr.a ?? ""), String(rr.b ?? ""));
    if (!e || !contactIds.has(e.a) || !contactIds.has(e.b)) continue;
    const k = edgeKey(e);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(e);
  }
  return out;
}
