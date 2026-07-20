import { requireUser } from "@/lib/supabase-server";
import { allow } from "@/lib/rate-limit";
import { validateStateWrite } from "@/lib/dashboard/state-schema";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gate = await requireUser(req);
  if (!gate.ok) return gate.response;
  const app = new URL(req.url).searchParams.get("app") ?? "";
  if (validateStateWrite(app, {}).ok === false && app !== "lifeCRM" && app !== "execCoach")
    return Response.json({ error: "unknown app" }, { status: 400 });
  const { data, error } = await gate.supabase.from("app_state")
    .select("data, version").eq("user_id", gate.userId).eq("app", app).maybeSingle();
  // A read error must NOT masquerade as "empty doc at version 0" — the client
  // would take the insert path and spin on 409s. 500 → client shows loadError.
  if (error) { console.warn("state: load failed"); return Response.json({ error: "load failed" }, { status: 500 }); }
  return Response.json({ data: data?.data ?? {}, version: Number(data?.version ?? 0) });
}

export async function PUT(req: Request) {
  const gate = await requireUser(req);
  if (!gate.ok) return gate.response;
  if (!allow(`${gate.userId}:state`, 120, 60_000)) return Response.json({ error: "Rate limited" }, { status: 429 });
  const app = new URL(req.url).searchParams.get("app") ?? "";
  const body = await req.json().catch(() => null);
  const v = validateStateWrite(app, body?.data);
  // Emit 413 for the size class so the client can treat it as NON-retryable
  // (a smaller doc is required) — distinct from other validation 400s and the
  // 409 conflict signal. Other rejections keep their 400.
  if (!v.ok) return Response.json({ error: v.reason }, { status: v.reason === "payload too large" ? 413 : v.status });
  const base = body?.baseVersion;
  if (typeof base !== "number" || !Number.isInteger(base) || base < 0)
    return Response.json({ error: "baseVersion required" }, { status: 400 });
  const now = new Date().toISOString();

  if (base === 0) {
    // Client believes no row exists yet (GET returned version 0). Insert-or-
    // nothing: a pre-existing row means the client's view is stale → 409.
    // upsert cannot be conditional, so ignoreDuplicates gives ON CONFLICT DO
    // NOTHING; select() then returns [] when nothing was inserted.
    const { data: inserted, error } = await gate.supabase.from("app_state")
      .upsert(
        { user_id: gate.userId, app, data: body.data, version: 1, updated_at: now },
        { onConflict: "user_id,app", ignoreDuplicates: true },
      )
      .select("version");
    if (error) { console.warn("state: insert failed"); return Response.json({ error: "save failed" }, { status: 500 }); }
    if (!inserted || inserted.length === 0) return Response.json({ error: "conflict" }, { status: 409 });
    return Response.json({ ok: true, version: 1 });
  }

  // Conditional update: applies only while the stored version still equals the
  // client's base. supabase-js does NOT error on 0 matched rows — the empty
  // returned array IS the conflict signal.
  const { data: updated, error } = await gate.supabase.from("app_state")
    .update({ data: body.data, version: base + 1, updated_at: now })
    .eq("user_id", gate.userId).eq("app", app).eq("version", base)
    .select("version");
  if (error) { console.warn("state: update failed"); return Response.json({ error: "save failed" }, { status: 500 }); }
  if (!updated || updated.length === 0) return Response.json({ error: "conflict" }, { status: 409 });
  return Response.json({ ok: true, version: base + 1 });
}
