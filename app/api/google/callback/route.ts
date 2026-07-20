import { requireUser } from "@/lib/supabase-server";
import { exchangeCode, storeRefreshToken } from "@/lib/google";
import {
  OAUTH_STATE_COOKIE,
  OAUTH_STATE_COOKIE_PATH,
  oauthStateMatches,
  readCookieValue,
} from "@/lib/oauth-state";
import { NextResponse } from "next/server";

/** Redirect to the dashboard, clearing the single-use state nonce on success AND failure. */
function redirectAndConsumeState(req: Request, result: "connected" | "error"): NextResponse {
  const res = NextResponse.redirect(new URL(`/dashboard?google=${result}`, req.url));
  res.cookies.set(OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: OAUTH_STATE_COOKIE_PATH,
    maxAge: 0,
  });
  return res;
}

export async function GET(req: Request) {
  const gate = await requireUser(req);
  if (!gate.ok) return gate.response;
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = readCookieValue(req.headers.get("cookie"), OAUTH_STATE_COOKIE);
  // CSRF check (review #15/#48): the returned state must match the random nonce set by
  // /api/google/connect. No comparison against gate.userId — that static value was the
  // vulnerability. requireUser above still gates who can reach this at all.
  if (!code || !oauthStateMatches(state, cookieState)) return redirectAndConsumeState(req, "error");
  try {
    const tok = await exchangeCode(code);
    if (!tok.refresh_token) return redirectAndConsumeState(req, "error");
    await storeRefreshToken(gate.supabase, gate.userId, tok.refresh_token, tok.scope);
    return redirectAndConsumeState(req, "connected");
  } catch {
    return redirectAndConsumeState(req, "error");
  }
}
