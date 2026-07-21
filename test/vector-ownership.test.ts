import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ownsStore } from "../lib/vector-store-ownership";

function mockSupabase(returnData: { vector_store_id: string } | null) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.maybeSingle = vi.fn(async () => ({ data: returnData }));
  return { from: vi.fn(() => chain) } as unknown as SupabaseClient;
}

describe("ownsStore", () => {
  it("true when a matching mapping exists", async () => {
    expect(await ownsStore(mockSupabase({ vector_store_id: "vs_1" }), "u1", "vs_1")).toBe(true);
  });
  it("false when no mapping (not owned)", async () => {
    expect(await ownsStore(mockSupabase(null), "u1", "vs_x")).toBe(false);
  });
  it("false + no query for empty storeId", async () => {
    const sb = mockSupabase(null);
    expect(await ownsStore(sb, "u1", "")).toBe(false);
    expect(sb.from).not.toHaveBeenCalled();
  });
});
