// test/state-sync.test.ts
import { describe, it, expect } from "vitest";
import { SaveQueue, replayPending, ConflictError, TooLargeError } from "@/lib/dashboard/state-sync";

function deferred<T = void>() {
  let resolve!: (v: T) => void;
  let reject!: (e?: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}
const tick = () => new Promise((r) => setTimeout(r, 0));

describe("replayPending", () => {
  it("applies queued updaters in order on top of the base", () => {
    const base = { items: ["server"] };
    const pending = [
      (p: { items: string[] }) => ({ items: [...p.items, "a"] }),
      (p: { items: string[] }) => ({ items: [...p.items, "b"] }),
    ];
    expect(replayPending(base, pending)).toEqual({ items: ["server", "a", "b"] });
  });
  it("returns the base unchanged for an empty queue", () => {
    const base = { n: 1 };
    expect(replayPending(base, [])).toBe(base);
  });
});

describe("SaveQueue", () => {
  it("sends a single submit and reports saving → saved", async () => {
    const calls: number[] = [];
    const statuses: string[] = [];
    const q = new SaveQueue<number>(async (d) => { calls.push(d); }, (s) => statuses.push(s));
    q.submit(1);
    await tick();
    expect(calls).toEqual([1]);
    expect(statuses).toEqual(["saving", "saved"]);
  });

  it("never overlaps sends and coalesces to the newest snapshot", async () => {
    const d1 = deferred();
    const sent: number[] = [];
    let active = 0, maxActive = 0;
    const q = new SaveQueue<number>(async (doc) => {
      active++; maxActive = Math.max(maxActive, active);
      sent.push(doc);
      if (doc === 1) await d1.promise; // first send stalls
      active--;
    }, () => {});
    q.submit(1);
    await tick();
    q.submit(2);
    q.submit(3); // arrives while 1 is still in flight — must coalesce with 2
    d1.resolve();
    await tick(); await tick();
    expect(sent).toEqual([1, 3]);   // 2 was superseded before its send started
    expect(maxActive).toBe(1);      // never concurrent
  });

  it("retries once on failure, re-reading the newest snapshot", async () => {
    const sent: number[] = [];
    const statuses: string[] = [];
    let failedOnce = false;
    const q = new SaveQueue<number>(async (doc) => {
      sent.push(doc);
      if (!failedOnce) { failedOnce = true; throw new Error("boom"); }
    }, (s) => statuses.push(s));
    q.submit(7);
    await tick(); await tick();
    expect(sent).toEqual([7, 7]);
    expect(statuses).toEqual(["saving", "saved"]);
  });

  it("reports error only when the final send of a chain fails both attempts", async () => {
    const statuses: string[] = [];
    const q = new SaveQueue<number>(async () => { throw new Error("down"); }, (s) => statuses.push(s));
    q.submit(1);
    await tick(); await tick();
    expect(statuses[statuses.length - 1]).toBe("error");
  });

  it("an old failed send followed by a newer submit ends with the newest doc saved", async () => {
    const d1 = deferred();
    const sent: number[] = [];
    const statuses: string[] = [];
    const q = new SaveQueue<number>(async (doc) => {
      sent.push(doc);
      if (doc === 1) { await d1.promise; throw new Error("stale send dies"); }
    }, (s) => statuses.push(s));
    q.submit(1);
    await tick();
    q.submit(2);          // newer snapshot arrives while 1 is stuck
    d1.resolve();
    await tick(); await tick(); await tick();
    expect(sent).toEqual([1, 2]);                    // no duplicate chained PUT of 2
    expect(sent[sent.length - 1]).toBe(2);           // newest wins on the wire
    expect(statuses[statuses.length - 1]).toBe("saved");
  });

  it("coalesces many rapid mid-flight submits into at most one follow-up send", async () => {
    const d1 = deferred();
    const sent: number[] = [];
    const q = new SaveQueue<number>(async (doc) => {
      sent.push(doc);
      if (doc === 0) await d1.promise; // first send stalls
    }, () => {});
    q.submit(0);
    await tick();
    for (let i = 1; i <= 10; i++) q.submit(i); // 10 rapid submits while 0 is in flight
    d1.resolve();
    await tick(); await tick();
    expect(sent).toEqual([0, 10]); // exactly one follow-up, carrying the NEWEST snapshot
  });

  it("reports the final send's status when a chained send fails after an earlier one succeeded", async () => {
    const d1 = deferred();
    const statuses: string[] = [];
    let n = 0;
    const q = new SaveQueue<number>(async () => {
      n++;
      if (n === 1) { await d1.promise; return; } // first send: succeeds (after stalling)
      throw new Error("chained send fails");     // second (chained) send: fails both attempts
    }, (s) => statuses.push(s));
    q.submit(1);
    await tick();
    q.submit(2); // arrives mid-flight → will chain after the first send settles
    d1.resolve();
    await tick(); await tick(); await tick();
    expect(statuses[statuses.length - 1]).toBe("error");
  });
});

describe("SaveQueue optimistic locking", () => {
  it("threads the advancing version into each send", async () => {
    const bases: number[] = [];
    const q = new SaveQueue<number>(async (_doc, base) => { bases.push(base); return base + 1; }, () => {});
    q.setBase(5);                 // from the initial GET
    q.submit(1);
    await tick();
    q.submit(2);
    await tick(); await tick();
    expect(bases).toEqual([5, 6]); // second send uses the version the first resolved
    expect(q.baseVersion).toBe(7);
  });

  it("a conflict stops the chain without a retry and reports 'conflict'", async () => {
    let sends = 0;
    const statuses: string[] = [];
    const q = new SaveQueue<number>(async () => { sends++; throw new ConflictError(); }, (s) => statuses.push(s));
    q.submit(1);
    await tick(); await tick();
    expect(sends).toBe(1);        // a stale base is never blindly resent
    expect(statuses).toEqual(["saving", "conflict"]);
  });

  it("a conflict drops the mid-flight dirty snapshot instead of resending it", async () => {
    const d1 = deferred();
    let sends = 0;
    const statuses: string[] = [];
    const q = new SaveQueue<number>(async () => {
      sends++;
      await d1.promise;
      throw new ConflictError();
    }, (s) => statuses.push(s));
    q.submit(1);
    await tick();
    q.submit(2);                  // arrives while 1 is in flight
    d1.resolve();
    await tick(); await tick(); await tick();
    expect(sends).toBe(1);        // 2 would carry the same stale base → dropped
    expect(statuses[statuses.length - 1]).toBe("conflict");
  });

  it("a network failure whose retry hits a conflict reports 'conflict'", async () => {
    let attempts = 0;
    const statuses: string[] = [];
    const q = new SaveQueue<number>(async () => {
      attempts++;
      if (attempts === 1) throw new Error("network down");
      throw new ConflictError();
    }, (s) => statuses.push(s));
    q.submit(1);
    await tick(); await tick();
    expect(attempts).toBe(2);     // generic failure still gets its one retry
    expect(statuses).toEqual(["saving", "conflict"]);
  });

  it("a too-large rejection stops the chain without a retry and reports 'too-large'", async () => {
    let sends = 0;
    const statuses: string[] = [];
    const q = new SaveQueue<number>(async () => { sends++; throw new TooLargeError(); }, (s) => statuses.push(s));
    q.submit(1);
    await tick(); await tick();
    expect(sends).toBe(1);        // over the size cap: a retry sends the same oversize body → never retried
    expect(statuses).toEqual(["saving", "too-large"]);
  });

  it("a too-large rejection drops the mid-flight dirty snapshot instead of resending it", async () => {
    const d1 = deferred();
    let sends = 0;
    const statuses: string[] = [];
    const q = new SaveQueue<number>(async () => {
      sends++;
      await d1.promise;
      throw new TooLargeError();
    }, (s) => statuses.push(s));
    q.submit(1);
    await tick();
    q.submit(2);                  // arrives while 1 is in flight
    d1.resolve();
    await tick(); await tick(); await tick();
    expect(sends).toBe(1);        // 2 is also over the cap → no chained resend
    expect(statuses[statuses.length - 1]).toBe("too-large");
  });

  it("recovers after a conflict once the base is refreshed", async () => {
    let fail = true;
    const bases: number[] = [];
    const statuses: string[] = [];
    const q = new SaveQueue<number>(async (_d, base) => {
      if (fail) { fail = false; throw new ConflictError(); }
      bases.push(base);
      return base + 1;
    }, (s) => statuses.push(s));
    q.submit(1);
    await tick(); await tick();
    expect(statuses[statuses.length - 1]).toBe("conflict");
    q.setBase(9);                 // owner re-GET stored the fresh server version
    q.submit(2);
    await tick(); await tick();
    expect(bases).toEqual([9]);
    expect(statuses[statuses.length - 1]).toBe("saved");
  });
});
