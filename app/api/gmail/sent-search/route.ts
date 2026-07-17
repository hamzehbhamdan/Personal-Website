import { requireUser } from "@/lib/supabase-server";
import { allow } from "@/lib/rate-limit";
import { getGoogleAccessToken } from "@/lib/google";
import { gmailSearchSent } from "@/lib/gmail-read";
import { parseSentSearchReq, buildSentQuery } from "@/lib/dashboard/people/gmail-schema";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Browse SENT mail by recipient/keyword — returns headers + Gmail snippet (display-only), no full body.
export async function POST(req: Request) {
  const gate = await requireUser(req);
  if (!gate.ok) return gate.response;
  if (!allow(`${gate.userId}:gmail-sent-search`, 15, 60_000)) return Response.json({ error: "Rate limited" }, { status: 429 });
  const parsed = parseSentSearchReq(await req.json().catch(() => null));
  if (!parsed.ok) return Response.json({ error: parsed.reason }, { status: 400 });
  const token = await getGoogleAccessToken(gate.supabase, gate.userId);
  if (!token) return Response.json({ connected: false, messages: [] }, { status: 409 });
  const q = buildSentQuery({ to: parsed.value.to, keyword: parsed.value.keyword });
  const r = await gmailSearchSent(token, { q, pageToken: parsed.value.pageToken || undefined });
  return Response.json({ connected: true, ...r });
}
