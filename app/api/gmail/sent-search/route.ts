import { requireUser } from "@/lib/supabase-server";
import { allow } from "@/lib/rate-limit";
import { getGoogleAccessToken } from "@/lib/google";
import { gmailListSent } from "@/lib/gmail-read";
import { parseSentSearchReq, sentRecipientQuery } from "@/lib/dashboard/people/gmail-schema";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// List recent SENT mail (optionally narrowed to a recipient) — headers + Gmail snippet (display-only),
// no full body. `ok:false` when the Gmail read itself failed (e.g. missing readonly scope), so the UI
// can prompt reconnect rather than show a misleading empty result. Keyword filtering is client-side.
export async function POST(req: Request) {
  const gate = await requireUser(req);
  if (!gate.ok) return gate.response;
  if (!allow(`${gate.userId}:gmail-sent-search`, 15, 60_000)) return Response.json({ error: "Rate limited" }, { status: 429 });
  const parsed = parseSentSearchReq(await req.json().catch(() => null));
  if (!parsed.ok) return Response.json({ error: parsed.reason }, { status: 400 });
  const token = await getGoogleAccessToken(gate.supabase, gate.userId);
  if (!token) return Response.json({ connected: false, ok: false, messages: [] }, { status: 409 });
  const q = sentRecipientQuery(parsed.value.to);
  const r = await gmailListSent(token, { q: q || undefined, pageToken: parsed.value.pageToken || undefined });
  return Response.json({ connected: true, ...r });
}
