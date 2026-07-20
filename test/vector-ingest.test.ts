import { describe, it, expect, vi, beforeEach } from "vitest";

const { embeddingsCreate, chatCreate, insertSingle, pdfParseMock } = vi.hoisted(() => ({
  embeddingsCreate: vi.fn(),
  chatCreate: vi.fn(),
  insertSingle: vi.fn(),
  pdfParseMock: vi.fn(),
}));

vi.mock("openai", () => ({
  default: class MockOpenAI {
    embeddings = { create: embeddingsCreate };
    chat = { completions: { create: chatCreate } };
    files = { create: vi.fn() };
  },
}));

vi.mock("pdf-parse", () => ({
  default: pdfParseMock,
}));

vi.mock("@/lib/supabase-server", () => ({
  requireUser: vi.fn(async () => ({
    ok: true,
    userId: "u1",
    supabase: {
      from: () => ({
        insert: () => ({
          select: () => ({ single: insertSingle }),
        }),
      }),
    },
  })),
}));

vi.mock("@/lib/vector-store-ownership", () => ({
  ownsStore: vi.fn(async () => true),
}));

vi.mock("@/lib/rate-limit", () => ({
  allow: vi.fn(() => true),
}));

import { POST } from "@/app/api/vector/ingest/route";

function makeFile(name: string, content: BlobPart, type = "text/plain"): File {
  return new File([content], name, { type });
}

function makeRequest(opts: { file?: File; content?: string; metadata?: string }): Request {
  const fd = new FormData();
  if (opts.file) fd.append("file", opts.file);
  if (opts.content !== undefined) fd.append("content", opts.content);
  if (opts.metadata !== undefined) fd.append("metadata", opts.metadata);
  return new Request("http://t/api/vector/ingest", { method: "POST", body: fd });
}

const PDF_HEADER = "%PDF-1.4\n%dummy pdf bytes for sniffing\n";

beforeEach(() => {
  embeddingsCreate.mockReset().mockResolvedValue({ data: [{ embedding: [0.1, 0.2] }] });
  chatCreate.mockReset().mockResolvedValue({ choices: [{ message: { content: "a description" } }] });
  insertSingle.mockReset().mockResolvedValue({ data: { id: 1 }, error: null });
  pdfParseMock.mockReset().mockResolvedValue({ text: "extracted pdf text" });
});

describe("POST /api/vector/ingest", () => {
  it("returns 400 (not 500) on malformed metadata JSON", async () => {
    const res = await POST(makeRequest({ content: "hello world", metadata: "not-json{{{" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/metadata/i);
    expect(embeddingsCreate).not.toHaveBeenCalled();
  });

  it("dispatches on the SNIFFED type, not the client-declared file.type: PNG bytes declared as application/pdf go through the image/vision branch", async () => {
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const disguised = makeFile("fake.pdf", pngBytes, "application/pdf");
    const res = await POST(makeRequest({ file: disguised }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.type).toBe("image");
    expect(chatCreate).toHaveBeenCalledTimes(1);
    expect(pdfParseMock).not.toHaveBeenCalled();
    // The vision data URL must carry the sniffed mime, not the spoofed one.
    const callArgs = chatCreate.mock.calls[0][0];
    const imageUrl = callArgs.messages[0].content[1].image_url.url;
    expect(imageUrl.startsWith("data:image/png;base64,")).toBe(true);
  });

  it("dispatches on the SNIFFED type in the other direction: real PDF bytes declared as text/plain are still parsed as a PDF", async () => {
    const pdfDeclaredAsText = makeFile("notes.txt", PDF_HEADER, "text/plain");
    const res = await POST(makeRequest({ file: pdfDeclaredAsText }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.type).toBe("pdf");
    expect(pdfParseMock).toHaveBeenCalledTimes(1);
    expect(chatCreate).not.toHaveBeenCalled();
  });

  it("returns 422 (not 500) when the sniffed PDF bytes fail to parse", async () => {
    pdfParseMock.mockRejectedValueOnce(new Error("corrupt PDF"));
    const badPdf = makeFile("broken.pdf", PDF_HEADER, "application/pdf");
    const res = await POST(makeRequest({ file: badPdf }));

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toMatch(/pdf/i);
    expect(embeddingsCreate).not.toHaveBeenCalled();
  });

  it("no longer rejects files by filename pattern (the filename-based injection check is gone)", async () => {
    const file = makeFile("mcp-injection-test.txt", "hello world", "text/plain");
    const res = await POST(makeRequest({ file }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.type).toBe("text");
  });

  it("still 415s on content that doesn't sniff to any allowed type", async () => {
    const binaryJunk = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0xff, 0xfe, 0x00, 0x01, 0x02, 0x03, 0xff, 0xfe, 0x00, 0x01, 0x02, 0x03]);
    const file = makeFile("junk.bin", binaryJunk, "text/plain");
    const res = await POST(makeRequest({ file }));
    expect(res.status).toBe(415);
  });
});
