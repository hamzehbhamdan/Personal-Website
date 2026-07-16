import { requireUser } from "@/lib/supabase-server";
import { allow } from "@/lib/rate-limit";
import { getGoogleAccessToken } from "@/lib/google";
import { gmailRecentSent } from "@/lib/gmail-read";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Reads the last few SENT message BODIES for one-time voice distillation (sanctioned exception to
// the metadata-only posture; security-reviewed). Auth + rate-limited; bodies never persisted here.
export async function POST(req: Request) {
  const gate = await requireUser(req);
  if (!gate.ok) return gate.response;
  if (!allow(`${gate.userId}:gmail-sent-samples`, 5, 60_000)) return Response.json({ error: "Rate limited" }, { status: 429 });
  const token = await getGoogleAccessToken(gate.supabase, gate.userId);
  if (!token) return Response.json({ connected: false, samples: [] }, { status: 409 });
  const samples = await gmailRecentSent(token, 5);
  return Response.json({ connected: true, samples });
}
