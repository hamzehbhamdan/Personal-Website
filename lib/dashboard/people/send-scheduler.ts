/**
 * Module-level undoable-send scheduler (review finding #26).
 *
 * The pending-send timeout must OUTLIVE the composer component: closing the
 * contact modal during the undo window must NOT cancel a send the user
 * explicitly confirmed. Keeping the timer here (outside React) means unmount
 * cleanup can't clear it — the only way to stop the send is the returned
 * cancel(), which the UI exposes as the Undo action on a toast.
 */
export interface PendingSend {
  /** True while the send is scheduled and has neither fired nor been cancelled. */
  readonly pending: boolean;
  /** Cancel the scheduled send. True if it was still pending (now cancelled); false if it already fired or was already cancelled. */
  cancel(): boolean;
}

/**
 * Dedupe map for in-flight sends, keyed by caller-supplied key (e.g. contact id).
 * Guards against a real double-send: the composer's `locked` guard is per-mount
 * React state, so remounting the composer for the SAME contact within the undo
 * window (closing/reopening the modal, toggling the draft panel) resets it and
 * lets a user re-confirm a second send to the same recipient. Keying by contact
 * id and cancelling any existing pending send for that key before scheduling the
 * new one ensures only the newest confirm for that contact ever fires, while
 * sends to different contacts (different keys) stay fully independent.
 */
const pendingByKey = new Map<string, PendingSend>();

export function scheduleSend(delayMs: number, fire: () => void, key?: string): PendingSend {
  if (key !== undefined) {
    pendingByKey.get(key)?.cancel();
  }

  let pending = true;
  const id = setTimeout(() => {
    pending = false;
    if (key !== undefined && pendingByKey.get(key) === handle) pendingByKey.delete(key);
    fire();
  }, delayMs);
  const handle: PendingSend = {
    get pending() {
      return pending;
    },
    cancel() {
      if (!pending) return false;
      pending = false;
      clearTimeout(id);
      if (key !== undefined && pendingByKey.get(key) === handle) pendingByKey.delete(key);
      return true;
    },
  };

  if (key !== undefined) pendingByKey.set(key, handle);
  return handle;
}
