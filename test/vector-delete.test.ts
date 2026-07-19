import { describe, it, expect, vi, beforeEach } from "vitest";

const { storesDelete, filesDelete, mappingEqFinal } = vi.hoisted(() => ({
  storesDelete: vi.fn(),
  filesDelete: vi.fn(),
  mappingEqFinal: vi.fn(),
}));

vi.mock("openai", () => ({
  default: class MockOpenAI {
    vectorStores = {
      delete: storesDelete,
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
      }),
    },
  })),
}));

vi.mock("@/lib/vector-store-ownership", () => ({
  ownsStore: vi.fn(async () => true),
}));

import { DELETE as deleteStore } from "@/app/api/vector/stores/route";
import { DELETE as deleteFile } from "@/app/api/vector/files/route";

beforeEach(() => {
  storesDelete.mockReset().mockResolvedValue({ id: "vs_1", deleted: true });
  filesDelete.mockReset().mockResolvedValue({ id: "file_1", deleted: true });
  mappingEqFinal.mockReset().mockResolvedValue({ error: null });
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
