import { encryptToken, decryptToken } from "@/lib/crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/gmail.metadata",
  "https://www.googleapis.com/auth/gmail.compose",
];

export function authUrl(state: string): string {
  const p = new URLSearchParams({
    client_id: process.env.GCAL_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT!,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    scope: GOOGLE_SCOPES.join(" "),
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
}

export async function exchangeCode(code: string): Promise<{ refresh_token?: string; scope?: string }> {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code, client_id: process.env.GCAL_CLIENT_ID!, client_secret: process.env.GCAL_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT!, grant_type: "authorization_code",
    }),
  });
  if (!r.ok) throw new Error("token exchange failed");
  return r.json();
}

export async function storeRefreshToken(supabase: SupabaseClient, userId: string, refresh: string, scope?: string) {
  await supabase.from("google_tokens").upsert({
    user_id: userId, enc_refresh: encryptToken(refresh), scope: scope ?? null, updated_at: new Date().toISOString(),
  });
}

/** Mint a short-lived access token from the stored (encrypted) refresh token. Returns null if not connected. */
export async function getGoogleAccessToken(supabase: SupabaseClient, userId: string): Promise<string | null> {
  const { data } = await supabase.from("google_tokens").select("enc_refresh").eq("user_id", userId).maybeSingle();
  if (!data?.enc_refresh) return null;
  const refresh = decryptToken(data.enc_refresh);
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GCAL_CLIENT_ID!, client_secret: process.env.GCAL_CLIENT_SECRET!,
      refresh_token: refresh, grant_type: "refresh_token",
    }),
  });
  if (!r.ok) { console.warn("google: refresh failed"); return null; } // refresh-failure path
  const j = await r.json();
  return j.access_token ?? null;
}
