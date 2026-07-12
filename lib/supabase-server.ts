import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { gateResult } from "./auth";

/** Cookie-bound server client (RLS applies as the signed-in user). */
export async function createServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, { ...options, httpOnly: true, sameSite: "lax", secure: true })
            );
          } catch {
            /* called from a context where cookies are read-only; middleware refreshes sessions */
          }
        },
      },
    }
  );
}

type Awaited1<T> = T extends Promise<infer U> ? U : T;
export type RequireUserResult =
  | { ok: true; supabase: Awaited1<ReturnType<typeof createServerSupabase>>; userId: string }
  | { ok: false; response: NextResponse };

/**
 * Gate a route: returns the authed client + userId, or a NextResponse to return immediately.
 * Also enforces the single-user ALLOWED_EMAIL and (for mutations) a same-origin check.
 */
export async function requireUser(req?: Request): Promise<RequireUserResult> {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const gate = gateResult(user, process.env.ALLOWED_EMAIL);
  if (!gate.ok) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: gate.status }) };
  }
  // CSRF defense-in-depth for state-changing requests: require same-origin.
  if (req && req.method !== "GET" && req.method !== "HEAD") {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    if (origin) {
      let originHost: string | null = null;
      try {
        originHost = new URL(origin).host;
      } catch {
        originHost = null; // unparseable / "null" origin → treat as cross-origin, fail closed
      }
      if (originHost === null || originHost !== host) {
        return { ok: false, response: NextResponse.json({ error: "Bad origin" }, { status: 403 }) };
      }
    }
  }
  return { ok: true, supabase, userId: gate.userId };
}
