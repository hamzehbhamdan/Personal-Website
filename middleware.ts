import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    // 1. Skip middleware for static assets, API routes, and Next.js internals
    if (
        request.nextUrl.pathname.startsWith("/api") ||
        request.nextUrl.pathname.startsWith("/_next") ||
        request.nextUrl.pathname.includes(".") // Files with extensions
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
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Authenticated Routes Protection
    // Only protect /dashboard and specific API routes
    const isDashboard = request.nextUrl.pathname.startsWith("/dashboard") || subdomain === "my";
    const isProtectedApi = request.nextUrl.pathname.startsWith("/api/vector") || request.nextUrl.pathname.startsWith("/api/briefing");

    if (isDashboard || isProtectedApi) {
        if (!user) {
            if (isProtectedApi) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
            return NextResponse.redirect(new URL("/login", request.url));
        }

        const allowedEmail = process.env.ALLOWED_EMAIL;
        if (allowedEmail && user.email !== allowedEmail) {
            if (isProtectedApi) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
            const url = new URL("/login", request.url);
            url.searchParams.set("error", "Unauthorized account");
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
