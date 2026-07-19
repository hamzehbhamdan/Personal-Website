// lib/dashboard/state-sync.ts
export type SaveStatus = "saving" | "saved" | "error";

/** Replay optimistic updaters (recorded before the initial GET resolved)
 *  on top of the freshly-loaded server document, in order. */
export function replayPending<T>(base: T, pending: Array<(prev: T) => T>): T {
  return pending.reduce((acc, fn) => fn(acc), base);
}

/**
 * Serializes full-document saves: at most one PUT in flight, every send
 * (and its single retry) reads the newest snapshot at send time, and a
 * snapshot submitted mid-flight chains exactly one follow-up send.
 * Status is reported only from the final send of a chain.
 */
export class SaveQueue<T> {
  private latest: T | null = null;
  private inFlight = false;
  private dirty = false;

  constructor(
    private putFn: (doc: T) => Promise<void>,
    private onStatus: (s: SaveStatus) => void,
  ) {}

  submit(doc: T): void {
    this.latest = doc;
    if (this.inFlight) { this.dirty = true; return; }
    void this.send();
  }

  private async send(): Promise<void> {
    this.inFlight = true;
    this.onStatus("saving");
    let ok: boolean;
    try {
      await this.putFn(this.latest as T);
      ok = true;
    } catch {
      try {
        await this.putFn(this.latest as T); // one retry — re-reads newest
        ok = true;
      } catch {
        ok = false;
      }
    }
    if (this.dirty) {
      this.dirty = false;
      return this.send(); // newer snapshot arrived mid-flight — chain it
    }
    this.inFlight = false;
    this.onStatus(ok ? "saved" : "error");
  }
}
