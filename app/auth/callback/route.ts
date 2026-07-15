import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { gateResult } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Supabase-Auth OAuth code-exchange handler ("Continue with Google").
 * Exchanges the PKCE code for an HttpOnly session, then enforces the
 * single-user ALLOWED_EMAIL allow-list before landing on the dashboard.
 * NOTE: This is Supabase Auth login, NOT the Calendar/Gmail connector OAuth.
 */
export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get("code");

    if (!code) {
        return NextResponse.redirect(new URL("/login?message=Could not sign in", req.url));
    }

    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
        return NextResponse.redirect(new URL("/login?message=Could not sign in", req.url));
    }

    // Enforce the single-user allow-list. Sign out non-matching accounts to
    // avoid a confusing half-logged-in state.
    const { data: { user } } = await supabase.auth.getUser();
    const gate = gateResult(user, process.env.ALLOWED_EMAIL);
    if (!gate.ok) {
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL("/login?message=Unauthorized account", req.url));
    }

    return NextResponse.redirect(new URL("/dashboard", req.url));
}
