import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the auth gate and the Google API surface; lib/oauth-state stays REAL so
// these tests exercise the actual cookie-parse + compare logic end to end.
vi.mock("@/lib/supabase-server", () => ({
  requireUser: vi.fn(),
}));
vi.mock("@/lib/google", () => ({
  authUrl: vi.fn(),
  exchangeCode: vi.fn(),
  storeRefreshToken: vi.fn(),
}));
import { requireUser, type RequireUserResult } from "@/lib/supabase-server";
import { authUrl, exchangeCode, storeRefreshToken } from "@/lib/google";

const fakeSupabase: unknown = { tag: "fake-supabase" };
const authedGate = { ok: true, supabase: fakeSupabase, userId: "owner-uuid-1" } as RequireUserResult;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireUser).mockResolvedValue(authedGate);
  vi.mocked(authUrl).mockImplementation(
    (s: string) => `https://accounts.google.com/o/oauth2/v2/auth?state=${encodeURIComponent(s)}`
  );
});

describe("/api/google/connect", () => {
  it("redirects to Google with a random state and sets the matching single-use nonce cookie", async () => {
    const { GET } = await import("@/app/api/google/connect/route");
    const res = await GET(new Request("http://localhost/api/google/connect"));
    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toBeTruthy();
    const state = new URL(location!).searchParams.get("state");
    expect(state).toMatch(/^[0-9a-f-]{36}$/); // crypto.randomUUID(), not the user id
    expect(state).not.toBe("owner-uuid-1");
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(`g_oauth_state=${state}`);
    expect(setCookie).toMatch(/httponly/i);
    expect(setCookie).toMatch(/secure/i);
    expect(setCookie).toMatch(/samesite=lax/i);
    expect(setCookie).toMatch(/max-age=600/i);
    expect(setCookie).toMatch(/path=\/api\/google/i);
  });

  it("issues a fresh nonce per request", async () => {
    const { GET } = await import("@/app/api/google/connect/route");
    const s1 = new URL((await GET(new Request("http://localhost/api/google/connect"))).headers.get("location")!).searchParams.get("state");
    const s2 = new URL((await GET(new Request("http://localhost/api/google/connect"))).headers.get("location")!).searchParams.get("state");
    expect(s1).not.toBe(s2);
  });

  it("still fails closed when unauthenticated", async () => {
    const { NextResponse } = await import("next/server");
    vi.mocked(requireUser).mockResolvedValue({ ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) });
    const { GET } = await import("@/app/api/google/connect/route");
    const res = await GET(new Request("http://localhost/api/google/connect"));
    expect(res.status).toBe(401);
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});

describe("/api/google/callback", () => {
  const callbackReq = (qs: string, cookie?: string) =>
    new Request(`http://localhost/api/google/callback${qs}`, cookie ? { headers: { cookie } } : undefined);

  it("stores the refresh token and clears the nonce cookie when state matches the cookie", async () => {
    vi.mocked(exchangeCode).mockResolvedValue({ refresh_token: "rt-1", scope: "scope-a" });
    const { GET } = await import("@/app/api/google/callback/route");
    const res = await GET(callbackReq("?code=c1&state=nonce-1", "g_oauth_state=nonce-1"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/dashboard?google=connected");
    expect(exchangeCode).toHaveBeenCalledWith("c1");
    expect(storeRefreshToken).toHaveBeenCalledWith(fakeSupabase, "owner-uuid-1", "rt-1", "scope-a");
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("g_oauth_state=;");
    expect(setCookie).toMatch(/max-age=0/i);
    expect(setCookie).toMatch(/path=\/api\/google/i);
  });

  it("rejects when the state does not match the cookie, without calling Google, and clears the cookie", async () => {
    const { GET } = await import("@/app/api/google/callback/route");
    const res = await GET(callbackReq("?code=c1&state=nonce-EVIL", "g_oauth_state=nonce-1"));
    expect(res.headers.get("location")).toBe("http://localhost/dashboard?google=error");
    expect(exchangeCode).not.toHaveBeenCalled();
    expect(storeRefreshToken).not.toHaveBeenCalled();
    expect(res.headers.get("set-cookie") ?? "").toMatch(/max-age=0/i);
  });

  it("rejects when the nonce cookie is absent (pins the CSRF fix: a bare crafted URL fails)", async () => {
    const { GET } = await import("@/app/api/google/callback/route");
    const res = await GET(callbackReq("?code=attacker-code&state=owner-uuid-1"));
    expect(res.headers.get("location")).toBe("http://localhost/dashboard?google=error");
    expect(exchangeCode).not.toHaveBeenCalled();
  });

  it("no longer accepts the old static user-id state (regression pin for #15/#48)", async () => {
    const { GET } = await import("@/app/api/google/callback/route");
    const res = await GET(callbackReq("?code=c1&state=owner-uuid-1", "g_oauth_state=nonce-1"));
    expect(res.headers.get("location")).toBe("http://localhost/dashboard?google=error");
    expect(storeRefreshToken).not.toHaveBeenCalled();
  });

  it("rejects a missing code but still consumes the nonce", async () => {
    const { GET } = await import("@/app/api/google/callback/route");
    const res = await GET(callbackReq("?state=nonce-1", "g_oauth_state=nonce-1"));
    expect(res.headers.get("location")).toBe("http://localhost/dashboard?google=error");
    expect(res.headers.get("set-cookie") ?? "").toMatch(/max-age=0/i);
  });

  it("clears the nonce cookie even when the token exchange throws", async () => {
    vi.mocked(exchangeCode).mockRejectedValue(new Error("boom"));
    const { GET } = await import("@/app/api/google/callback/route");
    const res = await GET(callbackReq("?code=c1&state=nonce-1", "g_oauth_state=nonce-1"));
    expect(res.headers.get("location")).toBe("http://localhost/dashboard?google=error");
    expect(res.headers.get("set-cookie") ?? "").toMatch(/max-age=0/i);
  });

  it("clears the nonce cookie when Google returns no refresh token", async () => {
    vi.mocked(exchangeCode).mockResolvedValue({ scope: "scope-a" });
    const { GET } = await import("@/app/api/google/callback/route");
    const res = await GET(callbackReq("?code=c1&state=nonce-1", "g_oauth_state=nonce-1"));
    expect(res.headers.get("location")).toBe("http://localhost/dashboard?google=error");
    expect(storeRefreshToken).not.toHaveBeenCalled();
    expect(res.headers.get("set-cookie") ?? "").toMatch(/max-age=0/i);
  });
});
