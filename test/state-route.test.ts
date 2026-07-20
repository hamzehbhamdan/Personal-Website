import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the gate so no real Supabase/network is needed (same pattern as api-auth.test.ts).
vi.mock("../lib/supabase-server", () => ({ requireUser: vi.fn() }));
import { requireUser, type RequireUserResult } from "../lib/supabase-server";
import { MAX_STATE_BYTES } from "../lib/dashboard/state-schema";
import { NextResponse } from "next/server";

type ChainResult = { data: unknown; error: unknown };
const ok = (data: unknown): ChainResult => ({ data, error: null });

/** Awaitable supabase query-builder stub: every method returns the chain; the
 *  chain itself is thenable and resolves to the result armed for the verb used.
 *  (supabase-js resolves with { data: [], error: null } on 0 matched rows — it
 *  does NOT error — so the stubs mirror that.) */
function makeSupabase(results: Partial<Record<"upsert" | "update" | "maybeSingle", ChainResult>>) {
  const chain: Record<string, unknown> = {};
  let terminal: ChainResult = ok(null);
  chain.upsert = vi.fn(() => { terminal = results.upsert ?? ok(null); return chain; });
  chain.update = vi.fn(() => { terminal = results.update ?? ok(null); return chain; });
  chain.select = vi.fn(() => chain);
  chain.eq = vi.fn(() => chain);
  chain.maybeSingle = vi.fn(async () => results.maybeSingle ?? ok(null));
  chain.then = (res: (v: ChainResult) => unknown, rej: (e: unknown) => unknown) =>
    Promise.resolve(terminal).then(res, rej);
  return { supabase: { from: vi.fn(() => chain) }, chain };
}

const authedWith = (supabase: unknown) =>
  vi.mocked(requireUser).mockResolvedValue({ ok: true, supabase, userId: "u1" } as RequireUserResult);

const putReq = (body: unknown) =>
  new Request("http://localhost/api/state?app=lifeCRM", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("/api/state versioned writes", () => {
  beforeEach(() => vi.resetAllMocks());

  it("PUT → 401 unauthenticated", async () => {
    vi.mocked(requireUser).mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    } as RequireUserResult);
    const { PUT } = await import("../app/api/state/route");
    const res = await PUT(putReq({ data: {}, baseVersion: 0 }));
    expect(res.status).toBe(401);
  });

  it("GET returns data + version", async () => {
    const { supabase } = makeSupabase({ maybeSingle: ok({ data: { a: 1 }, version: 4 }) });
    authedWith(supabase);
    const { GET } = await import("../app/api/state/route");
    const res = await GET(new Request("http://localhost/api/state?app=lifeCRM"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: { a: 1 }, version: 4 });
  });

  it("GET returns the empty doc at version 0 when no row exists", async () => {
    const { supabase } = makeSupabase({ maybeSingle: ok(null) });
    authedWith(supabase);
    const { GET } = await import("../app/api/state/route");
    const res = await GET(new Request("http://localhost/api/state?app=lifeCRM"));
    expect(await res.json()).toEqual({ data: {}, version: 0 });
  });

  it("PUT without a valid baseVersion → 400, and nothing is written", async () => {
    const { supabase, chain } = makeSupabase({});
    authedWith(supabase);
    const { PUT } = await import("../app/api/state/route");
    for (const bad of [
      { data: {} },
      { data: {}, baseVersion: -1 },
      { data: {}, baseVersion: 1.5 },
      { data: {}, baseVersion: "3" },
    ]) {
      const res = await PUT(putReq(bad));
      expect(res.status).toBe(400);
    }
    expect(chain.upsert).not.toHaveBeenCalled();
    expect(chain.update).not.toHaveBeenCalled();
  });

  it("PUT → 413 (not 400) when the payload exceeds the size cap, and nothing is written", async () => {
    const { supabase, chain } = makeSupabase({});
    authedWith(supabase);
    const { PUT } = await import("../app/api/state/route");
    const big = { blob: "x".repeat(MAX_STATE_BYTES + 10) };
    const res = await PUT(putReq({ data: big, baseVersion: 0 }));
    expect(res.status).toBe(413);            // non-retryable size class, distinct from 400/409
    expect(chain.upsert).not.toHaveBeenCalled();
    expect(chain.update).not.toHaveBeenCalled();
  });

  it("PUT → 400 (not 413) for a non-size validation failure (unknown app)", async () => {
    const { supabase } = makeSupabase({});
    authedWith(supabase);
    const { PUT } = await import("../app/api/state/route");
    const res = await PUT(
      new Request("http://localhost/api/state?app=evil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: {}, baseVersion: 0 }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("PUT baseVersion 0 takes the insert path (never update) and returns version 1", async () => {
    const { supabase, chain } = makeSupabase({ upsert: ok([{ version: 1 }]) });
    authedWith(supabase);
    const { PUT } = await import("../app/api/state/route");
    const res = await PUT(putReq({ data: { fresh: true }, baseVersion: 0 }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, version: 1 });
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "u1", app: "lifeCRM", data: { fresh: true }, version: 1 }),
      { onConflict: "user_id,app", ignoreDuplicates: true },
    );
    expect(chain.update).not.toHaveBeenCalled();
  });

  it("PUT baseVersion 0 → 409 when a row already exists (0 rows inserted)", async () => {
    const { supabase, chain } = makeSupabase({ upsert: ok([]) });
    authedWith(supabase);
    const { PUT } = await import("../app/api/state/route");
    const res = await PUT(putReq({ data: {}, baseVersion: 0 }));
    expect(res.status).toBe(409);
    expect(chain.update).not.toHaveBeenCalled();
  });

  it("PUT baseVersion N takes the conditional-update path and returns N+1", async () => {
    const { supabase, chain } = makeSupabase({ update: ok([{ version: 4 }]) });
    authedWith(supabase);
    const { PUT } = await import("../app/api/state/route");
    const res = await PUT(putReq({ data: { b: 2 }, baseVersion: 3 }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, version: 4 });
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ data: { b: 2 }, version: 4 }));
    expect(chain.eq).toHaveBeenCalledWith("version", 3);
    expect(chain.upsert).not.toHaveBeenCalled();
  });

  it("PUT baseVersion N → 409 when the stored version moved on (0 rows matched)", async () => {
    const { supabase } = makeSupabase({ update: ok([]) });
    authedWith(supabase);
    const { PUT } = await import("../app/api/state/route");
    const res = await PUT(putReq({ data: {}, baseVersion: 3 }));
    expect(res.status).toBe(409);
  });

  it("PUT surfaces a database error as 500, not a silent success", async () => {
    const { supabase } = makeSupabase({ update: { data: null, error: { message: "boom" } } });
    authedWith(supabase);
    const { PUT } = await import("../app/api/state/route");
    const res = await PUT(putReq({ data: {}, baseVersion: 2 }));
    expect(res.status).toBe(500);
  });
});
