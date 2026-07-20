import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { gateResult, isGatedPath, isStaticAsset } from "@/lib/auth";

export async function middleware(request: NextRequest) {
    // 1. Skip middleware for static assets, API routes, and Next.js internals
    if (
        request.nextUrl.pathname.startsWith("/api") ||
        request.nextUrl.pathname.startsWith("/_next") ||
        isStaticAsset(request.nextUrl.pathname) // Static files, by extension allowlist
    ) {
        return NextResponse.next();
    }

    // Subdomain routing
    const hostname = request.headers.get("host") || "";
    const subdomain = hostname.split(".")[0];

    // Check if we need to rewrite to /dashboard (for "my." subdomain)
    // Exclude /login, /subdomain, and other root paths that shouldn't be rewritten
    const isRewrite = subdomain === "my" &&
        !request.nextUrl.pathname.startsWith("/dashboard") &&
        !request.nextUrl.pathname.startsWith("/login") &&
        !request.nextUrl.pathname.startsWith("/auth");

    let response = isRewrite
        ? NextResponse.rewrite(new URL(`/dashboard${request.nextUrl.pathname}`, request.url), {
            request: { headers: request.headers },
        })
        : NextResponse.next({
            request: { headers: request.headers },
        });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );

                    // Re-create the response preserving the rewrite/next status
                    response = isRewrite
                        ? NextResponse.rewrite(new URL(`/dashboard${request.nextUrl.pathname}`, request.url), {
                            request,
                        })
                        : NextResponse.next({
                            request,
                        });

                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, { ...options, httpOnly: true, sameSite: "lax", secure: true })
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Let the Supabase-Auth OAuth callback through unauthenticated: the session
    // is only set BY exchangeCodeForSession, so gating /auth would redirect the
    // callback to /login before it can run. Returns the already-built response
    // (with any refreshed cookies). Does NOT weaken the gate for other paths.
    if (request.nextUrl.pathname.startsWith("/auth/")) return response;

    // Page protection only. Fails CLOSED via the same gateResult() the API uses:
    // if ALLOWED_EMAIL is unset OR the session email doesn't match, access is denied.
    // (Previously the allow-list check was skipped when ALLOWED_EMAIL was unset, letting
    // any authenticated Google account load the shell — now consistent with requireUser().)
    // NOTE: middleware does NOT run on /api (see matcher). API routes authenticate via requireUser().
    // /login and /auth/* stay reachable unauthenticated (see isGatedPath) —
    // gating them redirect-loops any logged-out browser on my.*.
    if (isGatedPath(request.nextUrl.pathname, subdomain)) {
        const gate = gateResult(user, process.env.ALLOWED_EMAIL);
        if (!gate.ok) {
            const url = new URL("/login", request.url);
            // 403 = signed in but not the allow-listed account (or allow-list misconfigured);
            // 401 = no session. Show the account message only for the former.
            if (gate.status === 403) url.searchParams.set("message", "Unauthorized account");
            return NextResponse.redirect(url);
        }
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json|js|css|map|ico)$).*)",
    ],
};
