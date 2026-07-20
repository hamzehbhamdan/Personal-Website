import { describe, it, expect, vi, beforeEach } from "vitest";

const { filesCreate, filesDelete, vsFilesCreate } = vi.hoisted(() => ({
  filesCreate: vi.fn(),
  filesDelete: vi.fn(),
  vsFilesCreate: vi.fn(),
}));

vi.mock("openai", () => ({
  default: class MockOpenAI {
    files = { create: filesCreate, delete: filesDelete };
    vectorStores = { files: { create: vsFilesCreate } };
  },
}));

vi.mock("@/lib/supabase-server", () => ({
  requireUser: vi.fn(async () => ({ ok: true, userId: "u1", supabase: {} })),
}));

vi.mock("@/lib/vector-store-ownership", () => ({
  ownsStore: vi.fn(async () => true),
}));

vi.mock("@/lib/rate-limit", () => ({
  allow: vi.fn(() => true),
}));

import { POST } from "@/app/api/vector/files/route";

function makeFile(name: string, content: BlobPart, type = "text/plain"): File {
  return new File([content], name, { type });
}

function makeRequest(files: File[], storeId = "vs_1"): Request {
  const fd = new FormData();
  for (const f of files) fd.append("file", f);
  fd.append("storeId", storeId);
  return new Request("http://t/api/vector/files", { method: "POST", body: fd });
}

beforeEach(() => {
  filesCreate.mockReset();
  filesDelete.mockReset().mockResolvedValue({ deleted: true });
  vsFilesCreate.mockReset();
});

describe("POST /api/vector/files", () => {
  it("rejects more than 5 files with a 4xx before uploading anything", async () => {
    const files = Array.from({ length: 6 }, (_, i) => makeFile(`f${i}.txt`, "hello world"));
    const res = await POST(makeRequest(files));
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    expect(filesCreate).not.toHaveBeenCalled();
  });

  it("rejects a file over 15MB with a 4xx and uploads nothing", async () => {
    const big = makeFile("big.txt", new Uint8Array(15 * 1024 * 1024 + 1));
    const res = await POST(makeRequest([big]));
    expect(res.status).toBe(413);
    expect(filesCreate).not.toHaveBeenCalled();
  });

  it("rejects a file whose sniffed content isn't in the allowed set", async () => {
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const png = makeFile("image.png", pngBytes, "image/png");
    const res = await POST(makeRequest([png]));
    expect(res.status).toBe(415);
    expect(filesCreate).not.toHaveBeenCalled();
  });

  it("branches on the sniffed type, not the client-declared file.type", async () => {
    // Client claims application/pdf but the bytes are actually a PNG signature.
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const disguised = makeFile("fake.pdf", pngBytes, "application/pdf");
    const res = await POST(makeRequest([disguised]));
    expect(res.status).toBe(415);
    expect(filesCreate).not.toHaveBeenCalled();
  });

  it("uploads multiple valid files sequentially and returns per-file results", async () => {
    filesCreate.mockImplementation(async (params: { file: File }) => ({
      id: `file_${params.file.name}`,
      bytes: 123,
      filename: params.file.name,
    }));
    vsFilesCreate.mockImplementation(async (_storeId: string, body: { file_id: string }) => ({
      id: body.file_id,
      object: "vector_store.file",
    }));

    const f1 = makeFile("a.txt", "hello world one");
    const f2 = makeFile("b.md", "hello world two", "text/markdown");
    const res = await POST(makeRequest([f1, f2]));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.count).toBe(2);
    expect(body.files.map((f: { filename: string; status: string }) => [f.filename, f.status])).toEqual([
      ["a.txt", "uploaded"],
      ["b.md", "uploaded"],
    ]);
    expect(filesCreate).toHaveBeenCalledTimes(2);
    expect(vsFilesCreate).toHaveBeenCalledTimes(2);
    // Sequential: the 2nd upload only starts after the 1st attach resolves.
    const createOrder = filesCreate.mock.invocationCallOrder[0];
    const attachOrder = vsFilesCreate.mock.invocationCallOrder[0];
    const secondCreateOrder = filesCreate.mock.invocationCallOrder[1];
    expect(createOrder).toBeLessThan(attachOrder);
    expect(attachOrder).toBeLessThan(secondCreateOrder);
  });

  it("rejects a batch where a LATER file is over-size, atomically — nothing is uploaded", async () => {
    const ok1 = makeFile("a.txt", "hello world one");
    const big = makeFile("big.txt", new Uint8Array(15 * 1024 * 1024 + 1));
    const res = await POST(makeRequest([ok1, big]));

    expect(res.status).toBe(413);
    expect(filesCreate).not.toHaveBeenCalled();
    expect(vsFilesCreate).not.toHaveBeenCalled();
  });

  it("rejects a batch where a LATER file has a bad sniff, atomically — nothing is uploaded", async () => {
    const ok1 = makeFile("a.txt", "hello world one");
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const badSniff = makeFile("image.png", pngBytes, "image/png");
    const res = await POST(makeRequest([ok1, badSniff]));

    expect(res.status).toBe(415);
    expect(filesCreate).not.toHaveBeenCalled();
    expect(vsFilesCreate).not.toHaveBeenCalled();
  });

  it("best-effort deletes the orphaned OpenAI file when the vector-store attach fails, and reports it failed without aborting the batch", async () => {
    filesCreate.mockImplementation(async (params: { file: File }) => ({
      id: `file_${params.file.name}`,
      bytes: 10,
      filename: params.file.name,
    }));
    vsFilesCreate.mockImplementation(async (_storeId: string, body: { file_id: string }) => {
      if (body.file_id === "file_bad.txt") throw new Error("attach failed");
      return { id: body.file_id, object: "vector_store.file" };
    });

    const good1 = makeFile("good1.txt", "hello world one");
    const bad = makeFile("bad.txt", "hello world two");
    const good2 = makeFile("good2.txt", "hello world three");
    const res = await POST(makeRequest([good1, bad, good2]));

    // Partial success must not be a bare 500 — the caller needs the per-file breakdown.
    expect(res.status).not.toBe(500);
    expect(filesDelete).toHaveBeenCalledWith("file_bad.txt");
    const body = await res.json();
    expect(body.files.map((f: { filename: string; status: string }) => [f.filename, f.status])).toEqual([
      ["good1.txt", "uploaded"],
      ["bad.txt", "failed"],
      ["good2.txt", "uploaded"],
    ]);
    // All three were attempted — count reflects only the successes.
    expect(filesCreate).toHaveBeenCalledTimes(3);
    expect(body.count).toBe(2);
  });

  it("a transient cleanup-delete failure doesn't crash the request and the file is still reported failed", async () => {
    filesCreate.mockResolvedValue({ id: "file_orphan2", bytes: 10, filename: "a.txt" });
    vsFilesCreate.mockRejectedValue(new Error("attach failed"));
    filesDelete.mockRejectedValue(new Error("delete also failed"));

    const res = await POST(makeRequest([makeFile("a.txt", "hello world")]));

    expect(res.status).not.toBe(500);
    expect(filesDelete).toHaveBeenCalledWith("file_orphan2");
    const body = await res.json();
    expect(body.files).toEqual([{ filename: "a.txt", status: "failed" }]);
  });
});
