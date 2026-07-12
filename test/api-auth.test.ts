import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the gate so no real Supabase/network is needed.
vi.mock("../lib/supabase-server", () => ({
  requireUser: vi.fn(),
}));
import { requireUser } from "../lib/supabase-server";
import { NextResponse } from "next/server";

describe("/api/chat auth", () => {
  beforeEach(() => vi.resetAllMocks());
  it("returns 401 when unauthenticated", async () => {
    (requireUser as any).mockResolvedValue({ ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) });
    const { POST } = await import("../app/api/chat/route");
    const res = await POST(new Request("http://localhost/api/chat", { method: "POST", body: "{}" }));
    expect(res.status).toBe(401);
  });
  it("returns 403 for a wrong (non-allowed) user", async () => {
    (requireUser as any).mockResolvedValue({ ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 403 }) });
    const { POST } = await import("../app/api/chat/route");
    const res = await POST(new Request("http://localhost/api/chat", { method: "POST", body: "{}" }));
    expect(res.status).toBe(403);
  });
});
