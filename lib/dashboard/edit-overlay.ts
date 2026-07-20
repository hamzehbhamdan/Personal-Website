// lib/dashboard/edit-overlay.ts
// Post-load unsaved-edit overlay for useAppState's optimistic-lock recovery.
//
// The initial-GET buffer (pendingRef + replayPending) preserves edits made
// BEFORE the doc loads. This module is its post-load counterpart: it retains the
// local edits made AFTER load that are not yet CONFIRMED on the server, so a 409
// conflict recovery can replay them on top of the freshly re-GET server doc and
// re-persist them on the new base — instead of silently overwriting them.
//
// The hard part is the clear boundary. A save carries a full-document snapshot,
// but the queue confirms it asynchronously, and the user may append more edits
// while that save is in flight. Clearing the WHOLE overlay on "saved" would drop
// any edit added after the submit but before its confirmation (exactly the edit
// the fix must preserve). So the overlay records `submittedLen` — the number of
// edits carried by the most recently submitted snapshot — and on confirmation
// drops only that prefix, leaving the still-unconfirmed suffix intact.
import { replayPending } from "@/lib/dashboard/state-sync";

export interface EditOverlay<T> {
  /** Post-load updaters, in order, whose effect is not yet confirmed on the server. */
  updaters: Array<(prev: T) => T>;
  /** Count of leading updaters carried by the last submitted snapshot (the
   *  boundary confirmSaved drops). 0 when no submit is outstanding. */
  submittedLen: number;
}

export function createOverlay<T>(): EditOverlay<T> {
  return { updaters: [], submittedLen: 0 };
}

/** Record a post-load edit as not-yet-confirmed. Appends in edit order. */
export function recordEdit<T>(o: EditOverlay<T>, updater: (prev: T) => T): void {
  o.updaters.push(updater);
}

/** Mark the boundary at submit time: the snapshot handed to the queue carries
 *  the current overlay in full, so its length is the prefix a matching "saved"
 *  will confirm. Called on EVERY submit; the last one before a confirmation is
 *  the one that lands (the queue coalesces to the newest snapshot). */
export function markSubmitted<T>(o: EditOverlay<T>): void {
  o.submittedLen = o.updaters.length;
}

/** A save was confirmed on the server: drop exactly the submitted prefix. Edits
 *  appended AFTER the matching submit (submittedLen never covered them) survive
 *  for the next recovery. A stray confirmation with no outstanding submit
 *  (submittedLen 0) is a no-op — it can never drop an unconfirmed edit. */
export function confirmSaved<T>(o: EditOverlay<T>): void {
  if (o.submittedLen > 0) o.updaters = o.updaters.slice(o.submittedLen);
  o.submittedLen = 0;
}

/** A 409 aborted the in-flight save: nothing was confirmed, so keep every
 *  updater but clear the boundary. Prevents a later out-of-order "saved" from
 *  dropping a prefix that never actually reached the server. */
export function abandonInFlight<T>(o: EditOverlay<T>): void {
  o.submittedLen = 0;
}

/** Replay the still-unconfirmed edits on top of a freshly re-GET server doc,
 *  in edit order. Used by conflict recovery to reconstruct the user's intent. */
export function replayOverlay<T>(o: EditOverlay<T>, base: T): T {
  return replayPending(base, o.updaters);
}

export function overlayHasEdits<T>(o: EditOverlay<T>): boolean {
  return o.updaters.length > 0;
}

/** Drop every unconfirmed edit and the submit boundary. Used only when the fresh
 *  server doc is known to already reflect them (a landed keepalive flush on
 *  bfcache restore) — replaying them on top would DOUBLE-APPLY. Never call this
 *  on a doc that might NOT contain the edits: that would silently drop them. */
export function resetOverlay<T>(o: EditOverlay<T>): void {
  o.updaters = [];
  o.submittedLen = 0;
}

// --- CR2: bounded auto-retry for a failed conflict-recovery re-GET -----------
//
// A conflict flips writes off (loadedRef=false) and re-GETs the fresh doc. If
// that re-GET itself REJECTS (network blip / 500), the hook must NOT stay wedged
// with writes disabled forever (edits would pile into the overlay and never
// send). We retry the re-GET a bounded number of times with exponential backoff;
// once exhausted we re-enable writes so the next stale-base save (or user edit)
// re-triggers recovery when connectivity returns. The overlay is never cleared
// on this path, so no unconfirmed edit is lost.

export const RECOVERY_MAX_RETRIES = 5;

/** Backoff (ms) before the Nth (0-indexed) recovery re-GET retry: 500, 1000,
 *  2000, 4000, 8000, capped at 8000. */
export function recoveryRetryDelay(attempt: number): number {
  return Math.min(500 * 2 ** Math.max(0, attempt), 8000);
}

export type RecoveryStep =
  | { action: "retry"; attempt: number; delay: number }
  | { action: "reenable" };

/** Decide what to do after a recovery re-GET fails, given how many retries have
 *  already run. Under the cap: schedule another retry after a backoff. At/over
 *  the cap: give up auto-retrying and re-enable writes so the hook is not
 *  permanently wedged (the next save re-attempts on the stale base and self-heals
 *  once the server is reachable again). Pure so the policy is unit-testable. */
export function nextRecoveryStep(attempt: number, max: number = RECOVERY_MAX_RETRIES): RecoveryStep {
  if (attempt < max) return { action: "retry", attempt: attempt + 1, delay: recoveryRetryDelay(attempt) };
  return { action: "reenable" };
}

// --- CR3: reconcile after a bfcache (pageshow persisted) restore -------------
//
// The pagehide keepalive PUT flushes the in-window edit with the STALE base and
// cannot read its response, so on a bfcache restore (refs survive, React does
// NOT remount) the queue base is still stale and the flushed updater is still in
// the overlay. A plain recovery would replay that already-sent updater on top of
// the server doc that already contains it → DOUBLE-APPLY. We resync via a re-GET
// and decide:
//   - the keepalive flushed AND the server advanced past the base we flushed
//     with ⇒ the flush landed; the fresh server doc is authoritative ⇒ adopt it
//     and drop the overlay (do NOT replay).
//   - otherwise ⇒ nothing we sent landed; replay the overlay on the server doc
//     and re-persist so the buffered edits are not dropped.

export type ResyncPlan = "adopt-server" | "replay-overlay";

export function planBfcacheResync(opts: {
  keepaliveFlushed: boolean;
  flushedBase: number;
  serverVersion: number;
}): ResyncPlan {
  if (opts.keepaliveFlushed && opts.serverVersion > opts.flushedBase) return "adopt-server";
  return "replay-overlay";
}
