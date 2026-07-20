"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { gateResult } from "@/lib/auth";

export async function login(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const cookieStore = await cookies();

    const supabase = createServerClient(
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
                            cookieStore.set(name, value, {
                                ...options,
                                httpOnly: true,
                                sameSite: "lax",
                                secure: true,
                            })
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    );

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.warn("Login failed");
        return redirect(`/login?message=${encodeURIComponent(error.message)}`);
    }

    // Enforce the single-user allow-list (mirrors app/auth/callback/route.ts).
    // Sign out a valid-but-unauthorized account so it can't strand an
    // unclearable session that refresh-churns on every request.
    const gate = gateResult(data.user, process.env.ALLOWED_EMAIL);
    if (!gate.ok) {
        await supabase.auth.signOut();
        return redirect(`/login?message=${encodeURIComponent("Unauthorized account")}`);
    }

    return redirect("/dashboard");
}
