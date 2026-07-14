"use server";

import { createServerSupabase } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export async function signout() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut(); // clears the HttpOnly cookie server-side via setAll
  redirect("/login");
}
