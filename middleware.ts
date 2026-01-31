import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });
    // Subdomain routing
    const hostname = request.headers.get("host") || "";
    const subdomain = hostname.split(".")[0];
    const isLocalhost = hostname.includes("localhost");

    // If we are on "my." subdomain (e.g. my.hamzehhamdan.com), rewrite to /dashboard
    if (subdomain === "my" && !request.nextUrl.pathname.startsWith("/dashboard")) {
        return NextResponse.rewrite(new URL(`/dashboard${request.nextUrl.pathname}`, request.url));
    }

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
                    response = NextResponse.next({
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
    const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");
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
        "/dashboard/:path*",
        "/api/vector/:path*",
        "/api/briefing/:path*"
    ],
};
