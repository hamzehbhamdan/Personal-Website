import { requireUser } from "@/lib/supabase-server";
import { allow } from "@/lib/rate-limit";
import { getGoogleAccessToken } from "@/lib/google";
import { gmailFetchBodies } from "@/lib/gmail-read";
import { parseSentBodiesReq } from "@/lib/dashboard/people/gmail-schema";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Read FULL bodies for the explicitly-selected SENT ids (≤20) for one-time voice distillation.
export async function POST(req: Request) {
  const gate = await requireUser(req);
  if (!gate.ok) return gate.response;
  if (!allow(`${gate.userId}:gmail-sent-bodies`, 5, 60_000)) return Response.json({ error: "Rate limited" }, { status: 429 });
  const parsed = parseSentBodiesReq(await req.json().catch(() => null));
  if (!parsed.ok) return Response.json({ error: parsed.reason }, { status: 400 });
  const token = await getGoogleAccessToken(gate.supabase, gate.userId);
  if (!token) return Response.json({ connected: false, samples: [] }, { status: 409 });
  const samples = await gmailFetchBodies(token, parsed.value.ids);
  return Response.json({ connected: true, samples });
}
