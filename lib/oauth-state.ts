/**
 * Pure helpers for the Google OAuth CSRF state nonce (review findings #15/#48).
 * The nonce lives in a short-lived httpOnly cookie set by /api/google/connect and
 * verified + cleared (single-use) by /api/google/callback. Kept dependency-free so
 * it is unit-testable without mocking Next request/cookie machinery.
 * Plain === (not timing-safe) is deliberate: the nonce is a high-entropy random
 * UUID, so timing leakage is not exploitable (see finding #15 verifier note).
 */

export const OAUTH_STATE_COOKIE = "g_oauth_state";
/** Scopes the cookie to /api/google/connect + /api/google/callback only. */
export const OAUTH_STATE_COOKIE_PATH = "/api/google";
/** Seconds. 10 minutes comfortably covers the Google consent round-trip. */
export const OAUTH_STATE_COOKIE_MAX_AGE = 600;

/** Parse one cookie's value out of a raw `Cookie` request header. Null if absent. */
export function readCookieValue(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() !== name) continue;
    const raw = part.slice(eq + 1).trim();
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw; // malformed %-encoding: compare the raw value rather than throwing
    }
  }
  return null;
}

/** True only when the OAuth `state` query param exactly matches a non-empty nonce cookie. */
export function oauthStateMatches(queryState: string | null, cookieState: string | null): boolean {
  return typeof queryState === "string" && queryState.length > 0 && queryState === cookieState;
}
