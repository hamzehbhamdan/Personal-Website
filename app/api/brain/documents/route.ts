// Brain's pgvector documents corpus — server-side replacement for the old
// SecondBrainView browser-Supabase query (broken under HttpOnly cookies).
import { requireUser } from "@/lib/supabase-server";
import { allow } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const gate = await requireUser(req);
  if (!gate.ok) return gate.response;
  if (!allow(`${gate.userId}:brain-docs`, 60, 60_000))
    return Response.json({ error: "Rate limited" }, { status: 429 });

  // `documents` has no created_at column — bigserial id is monotonic, so order by id.
  const { data, error } = await gate.supabase
    .from("documents")
    .select("id, content, metadata")
    .eq("user_id", gate.userId)
    .order("id", { ascending: false })
    .limit(200);
  if (error) {
    console.warn("brain-docs: list failed");
    return Response.json({ error: "Server error" }, { status: 500 });
  }
  const documents = (data ?? []).map((d) => {
    const meta = (d.metadata ?? {}) as { title?: string; type?: string };
    return {
      id: d.id,
      title: meta.title || (meta.type === "note" ? "Note" : "Document"),
      type: meta.type || "text",
      preview: typeof d.content === "string" ? d.content.slice(0, 160) : "",
    };
  });
  return Response.json({ documents });
}

export async function DELETE(req: Request) {
  const gate = await requireUser(req);
  if (!gate.ok) return gate.response;
  if (!allow(`${gate.userId}:brain-docs`, 60, 60_000))
    return Response.json({ error: "Rate limited" }, { status: 429 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  // RLS also scopes this; the explicit user_id filter is defense-in-depth.
  const { error } = await gate.supabase.from("documents").delete().eq("id", id).eq("user_id", gate.userId);
  if (error) {
    console.warn("brain-docs: delete failed");
    return Response.json({ error: "Server error" }, { status: 500 });
  }
  return Response.json({ ok: true });
}
