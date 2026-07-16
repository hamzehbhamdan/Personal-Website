// app/api/gmail/draft/route.ts
import { requireUser } from "@/lib/supabase-server";
import { allow } from "@/lib/rate-limit";
import { getGoogleAccessToken } from "@/lib/google";
import { buildDraftRaw, gmailCreateDraft } from "@/lib/gmail";
import { parseDraftReq } from "@/lib/dashboard/people/gmail-schema";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const gate = await requireUser(req); // auth + allow-list + same-origin (A0)
  if (!gate.ok) return gate.response;
  if (!allow(`${gate.userId}:gmail-draft`, 10, 60_000)) return Response.json({ error: "Rate limited" }, { status: 429 });
  const parsed = parseDraftReq(await req.json().catch(() => null));
  if (!parsed.ok) return Response.json({ error: parsed.reason }, { status: 400 });
  const token = await getGoogleAccessToken(gate.supabase, gate.userId);
  if (!token) return Response.json({ error: "Gmail not connected" }, { status: 409 });
  const { to, bcc, subject, body } = parsed.value;
  const draft = await gmailCreateDraft(token, buildDraftRaw(to, bcc, subject, body));
  if (!draft) return Response.json({ error: "draft create failed" }, { status: 502 });
  // Echo recipients so the UI can reconfirm what was created (nothing is sent).
  return Response.json({ ok: true, draftId: draft.id, to, bcc });
}
