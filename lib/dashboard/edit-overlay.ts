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

/** The stale-base guard. A debounce timer or pagehide flush that fires while a
 *  conflict recovery is outstanding (loadedRef flipped false) must NOT submit:
 *  its snapshot still carries the pre-conflict base and would 409 again, spawning
 *  a redundant recovery. Callers early-return when this is true. */
export function isRecovering(loaded: boolean): boolean {
  return !loaded;
}
