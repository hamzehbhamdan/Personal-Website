import { createBrowserClient } from "@supabase/ssr";
import { guardDataAccess } from "./supabase-guard";

/**
 * AUTH-FLOW-ONLY browser client.
 *
 * Session cookies are httpOnly (middleware.ts:57, lib/supabase-server.ts:20,
 * app/login/actions.ts:26) and @supabase/ssr's createBrowserClient reads
 * document.cookie, so this client can NEVER see the signed-in session —
 * table reads/writes are session-blind (0 rows / silent RLS failures).
 * OAuth initiation from GoogleButton still works because signInWithOAuth
 * only needs the JS-set (non-httpOnly) PKCE verifier cookie; the session is
 * created server-side in app/auth/callback/route.ts.
 *
 * guardDataAccess therefore makes every data-access property (.from, .rpc,
 * .storage, .channel, ...) throw loudly instead of rendering empty. Do not
 * remove the guard — port data access to a requireUser()-gated /api route
 * using createServerSupabase() instead (the pattern used by the live
 * people/coach/home/brain views). See docs/code-review-2026-07-19.md
 * finding #41 and docs/legacy-reintegration.md.
 */
export function createSupabaseBrowserClient() {
    return guardDataAccess(
        createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
    );
}
