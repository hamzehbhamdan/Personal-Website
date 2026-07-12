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
