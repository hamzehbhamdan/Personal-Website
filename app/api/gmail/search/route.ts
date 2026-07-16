// app/api/gmail/search/route.ts
import { requireUser } from "@/lib/supabase-server";
import { allow } from "@/lib/rate-limit";
import { getGoogleAccessToken } from "@/lib/google";
import { gmailSearch } from "@/lib/gmail";
import { parseSearchReq } from "@/lib/dashboard/people/gmail-schema";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const gate = await requireUser(req); // auth + allow-list + same-origin (A0)
  if (!gate.ok) return gate.response;
  if (!allow(`${gate.userId}:gmail-search`, 20, 60_000)) return Response.json({ error: "Rate limited" }, { status: 429 });
  const parsed = parseSearchReq(await req.json().catch(() => null));
  if (!parsed.ok) return Response.json({ error: parsed.reason }, { status: 400 });
  const token = await getGoogleAccessToken(gate.supabase, gate.userId);
  if (!token) return Response.json({ connected: false, rows: [] });
  const rows = await gmailSearch(token, parsed.value.mailbox); // subjects only
  return Response.json({ connected: true, rows });
}
