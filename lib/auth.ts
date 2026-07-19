export type GateUser = { id: string; email?: string | null } | null;
export type GateResult =
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 403 };

/** Pure allow-list decision. Fails closed when allowedEmail is missing. */
export function gateResult(user: GateUser, allowedEmail: string | undefined): GateResult {
  if (!user) return { ok: false, status: 401 };
  const allowed = allowedEmail?.trim().toLowerCase();
  if (!allowed) return { ok: false, status: 403 };
  const email = (user.email ?? "").trim().toLowerCase();
  if (email !== allowed) return { ok: false, status: 403 };
  return { ok: true, userId: user.id };
}

/**
 * True when a page request must pass the dashboard auth gate.
 * /login and /auth/* are exempt even on the my.* subdomain — they are the
 * only way IN, so gating them redirect-loops every unauthenticated browser
 * (ERR_TOO_MANY_REDIRECTS).
 */
export function isGatedPath(pathname: string, subdomain: string): boolean {
  const isDashboard = pathname.startsWith("/dashboard") || subdomain === "my";
  // Segment-exact match: exempt /login, /auth, and /auth/* ONLY. A raw
  // startsWith("/auth") would also exempt an unrelated /authors or /auth-debug
  // route, silently un-gating it on my.* — reintroducing the access bug.
  const isAuthSurface =
    pathname === "/login" || pathname === "/auth" || pathname.startsWith("/auth/");
  return isDashboard && !isAuthSurface;
}
