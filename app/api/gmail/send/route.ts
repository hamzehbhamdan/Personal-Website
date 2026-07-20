import { requireUser } from "@/lib/supabase-server";
import { allow } from "@/lib/rate-limit";
import { getGoogleAccessToken } from "@/lib/google";
import { gmailSendDraft } from "@/lib/gmail-send";
import { parseSendReq } from "@/lib/dashboard/people/gmail-schema";

export const dynamic = "force-dynamic";

// SANCTIONED single send route (reverses the never-send invariant). Sends a draft the client
// already created, BY draftId — the draft's stored recipients (baked in at draft-create time)
// govern the actual send. The `to/cc/bcc` echoed in the response are the CLIENT-CONFIRMED values
// used for the undo/confirmation UI; they are validated as confirmation friction but do NOT
// re-read or verify the draft's real recipients. auth + same-origin (requireUser) + a LOW
// irreversible rate-limit. This is the only send path in the codebase.
export async function POST(req: Request) {
  const gate = await requireUser(req);
  if (!gate.ok) return gate.response;
  if (!allow(`${gate.userId}:gmail-send`, 5, 60_000)) return Response.json({ error: "Rate limited" }, { status: 429 });
  const parsed = parseSendReq(await req.json().catch(() => null));
  if (!parsed.ok) return Response.json({ error: parsed.reason }, { status: 400 });
  const token = await getGoogleAccessToken(gate.supabase, gate.userId);
  if (!token) return Response.json({ error: "Gmail not connected" }, { status: 409 });
  const { draftId, to, cc, bcc } = parsed.value;
  const sent = await gmailSendDraft(token, draftId);
  if (!sent) return Response.json({ error: "send failed" }, { status: 502 });
  return Response.json({ ok: true, sent: true, to, cc, bcc });
}
