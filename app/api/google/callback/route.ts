import { requireUser } from "@/lib/supabase-server";
import { exchangeCode, storeRefreshToken } from "@/lib/google";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const gate = await requireUser(req);
  if (!gate.ok) return gate.response;
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || state !== gate.userId) return NextResponse.redirect(new URL("/dashboard?google=error", req.url));
  try {
    const tok = await exchangeCode(code);
    if (!tok.refresh_token) return NextResponse.redirect(new URL("/dashboard?google=error", req.url));
    await storeRefreshToken(gate.supabase, gate.userId, tok.refresh_token, tok.scope);
    return NextResponse.redirect(new URL("/dashboard?google=connected", req.url));
  } catch {
    return NextResponse.redirect(new URL("/dashboard?google=error", req.url));
  }
}
