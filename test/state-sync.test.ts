// test/state-sync.test.ts
import { describe, it, expect } from "vitest";
import { SaveQueue, replayPending } from "@/lib/dashboard/state-sync";

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
    expect(sent[sent.length - 1]).toBe(2);           // newest wins on the wire
    expect(statuses[statuses.length - 1]).toBe("saved");
  });
});
