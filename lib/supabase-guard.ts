/**
 * Guards for the session-blind browser-client trap
 * (docs/code-review-2026-07-19.md finding #41).
 *
 * All Supabase session cookies are forced httpOnly (middleware.ts,
 * lib/supabase-server.ts, app/login/actions.ts), so no browser-side client
 * can see the signed-in session: auth.uid() is null, strict RLS makes reads
 * return 0 rows and writes fail — silently, with typecheck and the whole
 * test suite still green. These helpers turn that silent failure into a
 * loud, explanatory throw. Browser data access must go through a
 * requireUser()-gated /api route using createServerSupabase()
 * (lib/supabase-server.ts), as the live people/coach/home/brain views do.
 */

export const SESSION_BLIND_MESSAGE =
    "Browser-side Supabase data access is disabled: session cookies are " +
    "httpOnly, so a browser client is session-blind (auth.uid() = null — " +
    "reads return 0 rows, writes fail RLS, and no error surfaces). Route " +
    "reads/writes through a requireUser()-gated /api route using " +
    "createServerSupabase() (lib/supabase-server.ts). See " +
    "docs/code-review-2026-07-19.md finding #41 and docs/legacy-reintegration.md.";

/** Client surface that needs the session: database, storage, realtime, edge functions. */
const DATA_ACCESS_PROPS = new Set<string>([
    "from",
    "rpc",
    "schema",
    "storage",
    "channel",
    "getChannels",
    "removeChannel",
    "removeAllChannels",
    "realtime",
    "functions",
]);

/**
 * Stand-in for a removed browser client: throws on ANY string property
 * access. Well-known symbols and `then` return undefined so logging or
 * accidentally awaiting the object doesn't crash unrelated code — only
 * actual use (.from, .auth, ...) fails, loudly.
 */
export function sessionBlindDeadClient<T extends object>(): T {
    return new Proxy(
        {},
        {
            get(_target, prop) {
                if (typeof prop === "symbol" || prop === "then") return undefined;
                throw new Error(SESSION_BLIND_MESSAGE);
            },
        }
    ) as unknown as T;
}

/**
 * Wraps a real client so the auth flow keeps working (OAuth initiation only
 * needs the JS-set, non-httpOnly PKCE verifier cookie; the session itself is
 * created server-side in app/auth/callback/route.ts) while every data-access
 * property throws loudly.
 *
 * Note: Reflect.get uses `target` (not the proxy) as receiver so internal
 * accessor properties on the client never re-enter the guard.
 */
export function guardDataAccess<T extends object>(client: T): T {
    return new Proxy(client, {
        get(target, prop) {
            if (typeof prop === "string" && DATA_ACCESS_PROPS.has(prop)) {
                throw new Error(SESSION_BLIND_MESSAGE);
            }
            return Reflect.get(target, prop, target);
        },
    });
}
