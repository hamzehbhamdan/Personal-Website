import { describe, it, expect, vi, beforeEach } from "vitest";

const { storesDelete, filesDelete, mappingEqFinal, storesRetrieve, selectEq } = vi.hoisted(() => ({
  storesDelete: vi.fn(),
  filesDelete: vi.fn(),
  mappingEqFinal: vi.fn(),
  storesRetrieve: vi.fn(),
  selectEq: vi.fn(),
}));

vi.mock("openai", () => ({
  default: class MockOpenAI {
    vectorStores = {
      delete: storesDelete,
      retrieve: storesRetrieve,
      files: { delete: filesDelete },
    };
  },
}));

vi.mock("@/lib/supabase-server", () => ({
  requireUser: vi.fn(async () => ({
    ok: true,
    userId: "u1",
    supabase: {
      from: () => ({
        delete: () => ({ eq: () => ({ eq: mappingEqFinal }) }),
        select: () => ({ eq: selectEq }),
      }),
    },
  })),
}));

vi.mock("@/lib/vector-store-ownership", () => ({
  ownsStore: vi.fn(async () => true),
}));

import { GET as getStores, DELETE as deleteStore } from "@/app/api/vector/stores/route";
import { DELETE as deleteFile } from "@/app/api/vector/files/route";

beforeEach(() => {
  storesDelete.mockReset().mockResolvedValue({ id: "vs_1", deleted: true });
  filesDelete.mockReset().mockResolvedValue({ id: "file_1", deleted: true });
  mappingEqFinal.mockReset().mockResolvedValue({ error: null });
  storesRetrieve.mockReset();
  selectEq.mockReset().mockResolvedValue({ data: [{ vector_store_id: "vs_1" }, { vector_store_id: "vs_2" }], error: null });
});

describe("DELETE /api/vector/stores", () => {
  it("calls the v6 delete(id) and removes the mapping", async () => {
    const res = await deleteStore(new Request("http://t/api/vector/stores?id=vs_1", { method: "DELETE" }));
    expect(res.status).toBe(200);
    expect(storesDelete).toHaveBeenCalledWith("vs_1");
    expect(mappingEqFinal).toHaveBeenCalled(); // DB cleanup reached
  });
  it("treats a remote 404 as success so the stale mapping is still cleaned up", async () => {
    storesDelete.mockRejectedValueOnce(Object.assign(new Error("nope"), { status: 404 }));
    const res = await deleteStore(new Request("http://t/api/vector/stores?id=vs_gone", { method: "DELETE" }));
    expect(res.status).toBe(200);
    expect(mappingEqFinal).toHaveBeenCalled();
  });
  it("still 500s on non-404 OpenAI failures", async () => {
    storesDelete.mockRejectedValueOnce(Object.assign(new Error("down"), { status: 500 }));
    const res = await deleteStore(new Request("http://t/api/vector/stores?id=vs_1", { method: "DELETE" }));
    expect(res.status).toBe(500);
  });
});

describe("DELETE /api/vector/files", () => {
  it("calls the v6 files.delete(fileId, { vector_store_id }) signature", async () => {
    const res = await deleteFile(new Request("http://t/api/vector/files?storeId=vs_1&fileId=file_1", { method: "DELETE" }));
    expect(res.status).toBe(200);
    expect(filesDelete).toHaveBeenCalledWith("file_1", { vector_store_id: "vs_1" });
  });
  it("treats a remote 404 as success", async () => {
    filesDelete.mockRejectedValueOnce(Object.assign(new Error("gone"), { status: 404 }));
    const res = await deleteFile(new Request("http://t/api/vector/files?storeId=vs_1&fileId=file_x", { method: "DELETE" }));
    expect(res.status).toBe(200);
  });
});

describe("GET /api/vector/stores", () => {
  it("retrieves each mapped store by id instead of filtering the first list() page", async () => {
    storesRetrieve.mockImplementation(async (id: string) => ({ id, name: `store ${id}` }));
    const res = await getStores();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.map((s: { id: string }) => s.id)).toEqual(["vs_1", "vs_2"]);
    expect(storesRetrieve).toHaveBeenCalledWith("vs_1");
    expect(storesRetrieve).toHaveBeenCalledWith("vs_2");
  });

  it("omits a 404'd store and self-heals its mapping row", async () => {
    storesRetrieve.mockImplementation(async (id: string) => {
      if (id === "vs_2") throw Object.assign(new Error("gone"), { status: 404 });
      return { id, name: `store ${id}` };
    });
    const res = await getStores();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.map((s: { id: string }) => s.id)).toEqual(["vs_1"]);
    expect(mappingEqFinal).toHaveBeenCalledWith("vector_store_id", "vs_2");
  });

  it("keeps the mapping and omits the store on transient non-404 failures", async () => {
    storesRetrieve.mockImplementation(async (id: string) => {
      if (id === "vs_2") throw Object.assign(new Error("down"), { status: 500 });
      return { id, name: `store ${id}` };
    });
    const res = await getStores();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.map((s: { id: string }) => s.id)).toEqual(["vs_1"]);
    expect(mappingEqFinal).not.toHaveBeenCalled();
  });

  it("returns [] without touching OpenAI when no mappings exist", async () => {
    selectEq.mockResolvedValue({ data: [], error: null });
    const res = await getStores();
    expect(await res.json()).toEqual([]);
    expect(storesRetrieve).not.toHaveBeenCalled();
  });
});
