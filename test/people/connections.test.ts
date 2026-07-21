import { describe, it, expect } from "vitest";
import {
  canonEdge, edgeKey, hasEdge, addEdge, removeEdge, cliqueEdges, mergeClique, neighbors, pruneEdges, shortestPath,
} from "../../lib/dashboard/people/connections";
import { emptyDb, normalizeDb } from "../../lib/dashboard/people/backup";
import type { Edge } from "../../lib/dashboard/people/types";

const keys = (edges: Edge[]) => edges.map(edgeKey).sort();

describe("canonEdge", () => {
  it("orders endpoints a < b", () => {
    expect(canonEdge("b", "a")).toEqual({ a: "a", b: "b" });
    expect(canonEdge("a", "b")).toEqual({ a: "a", b: "b" });
  });
  it("returns null for a self-loop", () => {
    expect(canonEdge("a", "a")).toBeNull();
  });
});

describe("addEdge", () => {
  it("adds a canonical edge regardless of argument order", () => {
    expect(addEdge([], "b", "a")).toEqual([{ a: "a", b: "b" }]);
  });
  it("is idempotent (no duplicate for an existing pair)", () => {
    const once = addEdge([], "a", "b");
    expect(addEdge(once, "b", "a")).toHaveLength(1);
  });
  it("ignores a self-loop", () => {
    expect(addEdge([], "a", "a")).toEqual([]);
  });
});

describe("hasEdge", () => {
  it("is order-independent", () => {
    const e = addEdge([], "a", "b");
    expect(hasEdge(e, "b", "a")).toBe(true);
    expect(hasEdge(e, "a", "c")).toBe(false);
  });
});

describe("removeEdge", () => {
  it("removes the matching pair, order-independent", () => {
    const e: Edge[] = [{ a: "a", b: "b" }, { a: "a", b: "c" }];
    expect(removeEdge(e, "b", "a")).toEqual([{ a: "a", b: "c" }]);
  });
});

describe("cliqueEdges", () => {
  it("produces n·(n-1)/2 canonical pairs", () => {
    expect(keys(cliqueEdges(["a", "b", "c"]))).toEqual(["a|b", "a|c", "b|c"]);
  });
  it("dedups the input ids", () => {
    expect(cliqueEdges(["a", "a", "b"])).toEqual([{ a: "a", b: "b" }]);
  });
  it("is empty for fewer than 2 distinct ids", () => {
    expect(cliqueEdges(["a"])).toEqual([]);
    expect(cliqueEdges([])).toEqual([]);
  });
});

describe("mergeClique", () => {
  it("adds only the missing pairs (idempotent union)", () => {
    const start: Edge[] = [{ a: "a", b: "b" }];
    const merged = mergeClique(start, ["a", "b", "c"]);
    expect(keys(merged)).toEqual(["a|b", "a|c", "b|c"]);
    expect(keys(mergeClique(merged, ["a", "b", "c"]))).toEqual(["a|b", "a|c", "b|c"]);
  });
});

describe("neighbors", () => {
  it("returns the other endpoint of each incident edge", () => {
    const e: Edge[] = [{ a: "a", b: "b" }, { a: "a", b: "c" }];
    expect(neighbors(e, "a").sort()).toEqual(["b", "c"]);
    expect(neighbors(e, "b")).toEqual(["a"]);
    expect(neighbors(e, "z")).toEqual([]);
  });
});

describe("pruneEdges", () => {
  it("drops dangling ids, self-loops, and duplicates; canonicalizes", () => {
    const raw: unknown = [{ a: "b", b: "a" }, { a: "a", b: "x" }, { a: "a", b: "a" }, { a: "a", b: "b" }];
    const out = pruneEdges(raw, new Set(["a", "b"]));
    expect(keys(out)).toEqual(["a|b"]);
  });
});

describe("shortestPath", () => {
  const E = (pairs: [string, string][]): Edge[] => pairs.map(([a, b]) => canonEdge(a, b)!);

  it("returns the inclusive node path by fewest hops", () => {
    expect(shortestPath(E([["a", "b"], ["b", "c"]]), "a", "c")).toEqual(["a", "b", "c"]);
  });
  it("finds the shortest route among alternatives", () => {
    const edges = E([["a", "b"], ["b", "c"], ["a", "c"], ["c", "d"]]);
    expect(shortestPath(edges, "a", "d")).toEqual(["a", "c", "d"]);
  });
  it("is [from] when from === to", () => {
    expect(shortestPath(E([["a", "b"]]), "a", "a")).toEqual(["a"]);
  });
  it("is null when disconnected or absent", () => {
    expect(shortestPath(E([["a", "b"], ["c", "d"]]), "a", "d")).toBeNull();
    expect(shortestPath(E([["a", "b"]]), "a", "z")).toBeNull();
  });
});

describe("CrmDB connections (emptyDb + normalizeDb)", () => {
  it("emptyDb has an empty connections array", () => {
    expect(emptyDb().connections).toEqual([]);
  });
  it("keeps valid edges and prunes dangling/self/dupe on load", () => {
    const raw = {
      contacts: [{ id: "a" }, { id: "b" }],
      connections: [{ a: "b", b: "a" }, { a: "a", b: "gone" }, { a: "a", b: "a" }, { a: "a", b: "b" }],
    };
    expect(normalizeDb(raw).connections).toEqual([{ a: "a", b: "b" }]);
  });
  it("defaults connections to [] when absent", () => {
    expect(normalizeDb({ contacts: [] }).connections).toEqual([]);
  });
});
