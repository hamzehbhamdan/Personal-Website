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

export function scheduleSend(delayMs: number, fire: () => void): PendingSend {
  let pending = true;
  const id = setTimeout(() => {
    pending = false;
    fire();
  }, delayMs);
  return {
    get pending() {
      return pending;
    },
    cancel() {
      if (!pending) return false;
      pending = false;
      clearTimeout(id);
      return true;
    },
  };
}
