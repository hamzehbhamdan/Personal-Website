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
  const { data } = await gate.supabase.from("app_state").select("data").eq("user_id", gate.userId).eq("app", app).maybeSingle();
  return Response.json({ data: data?.data ?? {} });
}

export async function PUT(req: Request) {
  const gate = await requireUser(req);
  if (!gate.ok) return gate.response;
  if (!allow(`${gate.userId}:state`, 120, 60_000)) return Response.json({ error: "Rate limited" }, { status: 429 });
  const app = new URL(req.url).searchParams.get("app") ?? "";
  const body = await req.json().catch(() => null);
  const v = validateStateWrite(app, body?.data);
  if (!v.ok) return Response.json({ error: v.reason }, { status: v.status });
  const { error } = await gate.supabase.from("app_state")
    .upsert({ user_id: gate.userId, app, data: body.data, updated_at: new Date().toISOString() });
  if (error) { console.warn("state: upsert failed"); return Response.json({ error: "save failed" }, { status: 500 }); }
  return Response.json({ ok: true });
}
