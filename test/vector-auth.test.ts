import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lib/supabase-server", () => ({ requireUser: vi.fn() }));
import { requireUser, type RequireUserResult } from "../lib/supabase-server";
import { NextResponse } from "next/server";

const unauth = () =>
  vi.mocked(requireUser).mockResolvedValue({ ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as RequireUserResult);

describe("vector routes require auth", () => {
  beforeEach(() => vi.resetAllMocks());

  it("POST /api/vector/ingest → 401 unauthenticated", async () => {
    unauth();
    const { POST } = await import("../app/api/vector/ingest/route");
    const res = await POST(new Request("http://localhost/api/vector/ingest", { method: "POST" }));
    expect(res.status).toBe(401);
  });

  it("GET /api/vector/stores → 401 unauthenticated", async () => {
    unauth();
    const { GET } = await import("../app/api/vector/stores/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("POST /api/vector/stores → 401 unauthenticated", async () => {
    unauth();
    const { POST } = await import("../app/api/vector/stores/route");
    const res = await POST(new Request("http://localhost/api/vector/stores", { method: "POST" }));
    expect(res.status).toBe(401);
  });

  it("GET /api/vector/files → 401 unauthenticated", async () => {
    unauth();
    const { GET } = await import("../app/api/vector/files/route");
    const res = await GET(new Request("http://localhost/api/vector/files?storeId=vs_x"));
    expect(res.status).toBe(401);
  });
});
