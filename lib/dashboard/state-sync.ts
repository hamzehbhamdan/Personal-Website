// lib/dashboard/state-sync.ts
export type SaveStatus = "saving" | "saved" | "error" | "conflict";

/** PUT rejected with 409: our baseVersion is stale. Never blindly retried. */
export class ConflictError extends Error {
  constructor(message = "state version conflict") {
    super(message);
    this.name = "ConflictError";
  }
}

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
 *
 * Optimistic locking: the queue owns the server document version. putFn
 * receives (doc, baseVersion) and resolves the NEW version on success
 * (resolving void leaves the base unchanged). A ConflictError — HTTP 409,
 * someone else advanced the doc — aborts the chain WITHOUT retrying or
 * resending the dirty snapshot (either would carry the same stale base),
 * and reports the distinct "conflict" status so the owner can re-GET and
 * refresh the base via setBase().
 */
export class SaveQueue<T> {
  private latest: T | null = null;
  private inFlight = false;
  private dirty = false;
  private base = 0;

  constructor(
    private putFn: (doc: T, baseVersion: number) => Promise<number | void>,
    private onStatus: (s: SaveStatus) => void,
  ) {}

  /** Store the server version (after the initial GET or a conflict re-GET). */
  setBase(version: number): void { this.base = version; }
  get baseVersion(): number { return this.base; }

  submit(doc: T): void {
    this.latest = doc;
    if (this.inFlight) { this.dirty = true; return; }
    void this.send();
  }

  private async send(): Promise<void> {
    this.inFlight = true;
    this.onStatus("saving");
    let outcome: "ok" | "error" | "conflict" = "error";
    // Up to two attempts (one send + one retry). Clear `dirty` at the START of
    // each attempt so it means strictly "a newer snapshot arrived AFTER we
    // began sending the current one". The retry re-reads this.latest and so
    // already carries any snapshot submitted before it; without this per-attempt
    // reset, that snapshot would also (wrongly) trigger a redundant chained PUT
    // of an identical value — violating the exactly-one-follow-up guarantee.
    for (let attempt = 0; attempt < 2 && outcome !== "ok"; attempt++) {
      this.dirty = false;
      try {
        this.advance(await this.putFn(this.latest as T, this.base));
        outcome = "ok";
      } catch (e) {
        if (e instanceof ConflictError) {
          // A stale base 409s; retrying with the SAME base just 409s again, so
          // abort the chain with no retry and no resend of the dirty snapshot.
          outcome = "conflict";
          break;
        }
        // generic failure: fall through to the retry (attempt 1) or give up
      }
    }
    if (outcome === "conflict") {
      this.dirty = false;   // dropping, not resending: same stale base would 409 again
      this.inFlight = false;
      this.onStatus("conflict");
      return;
    }
    if (this.dirty) {
      // A snapshot arrived during the last await and has NOT been sent yet.
      return this.send(); // chain exactly one follow-up send of the newest doc
    }
    this.inFlight = false;
    this.onStatus(outcome === "ok" ? "saved" : "error");
  }

  private advance(v: number | void): void {
    if (typeof v === "number") this.base = v;
  }
}
