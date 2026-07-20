import { requireUser } from "@/lib/supabase-server";
import { authUrl } from "@/lib/google";
import {
  OAUTH_STATE_COOKIE,
  OAUTH_STATE_COOKIE_MAX_AGE,
  OAUTH_STATE_COOKIE_PATH,
} from "@/lib/oauth-state";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const gate = await requireUser(req);
  if (!gate.ok) return gate.response;
  // Per-request random nonce (review #15/#48): the CSRF token must be unpredictable
  // and single-use, never the stable user id. sameSite=lax (NOT strict) so the cookie
  // survives the top-level GET redirect back from accounts.google.com.
  const state = crypto.randomUUID();
  const res = NextResponse.redirect(authUrl(state));
  res.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: OAUTH_STATE_COOKIE_PATH,
    maxAge: OAUTH_STATE_COOKIE_MAX_AGE,
  });
  return res;
}
