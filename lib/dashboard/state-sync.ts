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
    let ok = false;
    // Up to two attempts (one send + one retry). Clear `dirty` at the START of
    // each attempt so it means strictly "a newer snapshot arrived AFTER we
    // began sending the current one". The retry re-reads this.latest and so
    // already carries any snapshot submitted before it; without this per-attempt
    // reset, that snapshot would also (wrongly) trigger a redundant chained PUT
    // of an identical value — violating the exactly-one-follow-up guarantee.
    for (let attempt = 0; attempt < 2 && !ok; attempt++) {
      this.dirty = false;
      try {
        await this.putFn(this.latest as T);
        ok = true;
      } catch {
        // fall through: retry (attempt 1) or give up after the retry fails
      }
    }
    if (this.dirty) {
      // A snapshot arrived during the last await and has NOT been sent yet.
      return this.send(); // chain exactly one follow-up send of the newest doc
    }
    this.inFlight = false;
    this.onStatus(ok ? "saved" : "error");
  }
}
