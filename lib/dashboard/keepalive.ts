// lib/dashboard/keepalive.ts
// Pure helper for the pagehide tab-close flush (useAppState, finding #39).

// fetch keepalive caps the total in-flight body at 64KB (Fetch spec); leave
// headroom below that so headers/encoding never push us over. A body at or
// above this size cannot ride a keepalive request, so the flush must fall back
// to a normal queue submit (documented residual gap: that fallback usually
// dies with the page on a real close, but server-side versioning keeps every
// path safe — a save either lands or 409s, never silently overwrites).
export const KEEPALIVE_MAX_BODY_BYTES = 60_000;

/**
 * True when the serialized request body is small enough to ride a
 * `fetch(..., { keepalive: true })` on pagehide. Byte-accurate (UTF-8), so a
 * doc padded with multi-byte characters is measured by its real wire size, and
 * the count includes the `{ data, baseVersion }` wrapper the hook sends.
 */
export function fitsKeepalive(body: string, max: number = KEEPALIVE_MAX_BODY_BYTES): boolean {
  return new Blob([body]).size < max;
}
