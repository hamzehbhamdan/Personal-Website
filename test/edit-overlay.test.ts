// test/edit-overlay.test.ts
import { describe, it, expect } from "vitest";
import {
  createOverlay,
  recordEdit,
  markSubmitted,
  confirmSaved,
  abandonInFlight,
  replayOverlay,
  overlayHasEdits,
  resetOverlay,
  isRecovering,
  nextRecoveryStep,
  recoveryRetryDelay,
  RECOVERY_MAX_RETRIES,
  planBfcacheResync,
} from "@/lib/dashboard/edit-overlay";

type Doc = { done: boolean; subtask: boolean; other: string };
const seed = (): Doc => ({ done: false, subtask: false, other: "server" });
const setDone = (p: Doc): Doc => ({ ...p, done: true });
const checkSubtask = (p: Doc): Doc => ({ ...p, subtask: true });

describe("EditOverlay basics", () => {
  it("starts empty with no submit boundary", () => {
    const o = createOverlay<Doc>();
    expect(o.updaters).toEqual([]);
    expect(o.submittedLen).toBe(0);
    expect(overlayHasEdits(o)).toBe(false);
    expect(replayOverlay(o, seed())).toEqual(seed()); // no-op replay
  });

  it("records edits in order and replays them onto a base", () => {
    const o = createOverlay<Doc>();
    recordEdit(o, setDone);
    recordEdit(o, checkSubtask);
    expect(overlayHasEdits(o)).toBe(true);
    expect(replayOverlay(o, seed())).toEqual({ done: true, subtask: true, other: "server" });
  });
});

describe("clear boundary — confirmSaved", () => {
  it("(b) drops exactly the confirmed prefix and never re-applies it on replay", () => {
    const o = createOverlay<Doc>();
    recordEdit(o, setDone);
    recordEdit(o, checkSubtask);
    markSubmitted(o);        // both edits ride the submitted snapshot (len 2)
    expect(o.submittedLen).toBe(2);
    confirmSaved(o);         // server now has both → drop them
    expect(o.updaters).toEqual([]);
    expect(o.submittedLen).toBe(0);
    // A LATER conflict must not double-apply the already-saved edits: replaying
    // onto a fresh server doc (which already contains them) is a clean no-op.
    const freshServerDoc: Doc = { done: true, subtask: true, other: "advanced-by-other-tab" };
    expect(replayOverlay(o, freshServerDoc)).toEqual(freshServerDoc);
  });

  it("(a)+(b) keeps an edit added during the in-flight window while dropping the confirmed one", () => {
    const o = createOverlay<Doc>();
    recordEdit(o, setDone);   // this edit's save goes out...
    markSubmitted(o);         // ...carrying submittedLen = 1
    recordEdit(o, checkSubtask); // user checks a subtask WHILE the save is in flight
    expect(o.submittedLen).toBe(1); // boundary unchanged: subtask edit is beyond it
    confirmSaved(o);          // the setDone save confirmed
    expect(o.updaters).toHaveLength(1); // subtask edit retained, setDone dropped
    // On a fresh server doc (has done=true from the confirmed save, but NOT the
    // subtask), replay re-applies ONLY the unconfirmed subtask edit — no double
    // apply of setDone, no loss of the in-flight-window edit.
    const freshServerDoc: Doc = { done: true, subtask: false, other: "advanced" };
    expect(replayOverlay(o, freshServerDoc)).toEqual({ done: true, subtask: true, other: "advanced" });
  });

  it("a stray confirmation with no outstanding submit cannot drop an unconfirmed edit", () => {
    const o = createOverlay<Doc>();
    recordEdit(o, setDone);
    // no markSubmitted → submittedLen stays 0
    confirmSaved(o);
    expect(o.updaters).toHaveLength(1); // edit preserved
  });
});

describe("clear boundary — losing save / conflict", () => {
  it("(a) an edit made during a LOSING save's in-flight window is retained and replayed", () => {
    // Concrete repro: a task is dragged to Done (its PUT goes out); while that PUT
    // is in flight the user checks a subtask; the PUT 409s. Both edits are still
    // unconfirmed and must replay on top of the freshly re-GET server doc.
    const o = createOverlay<Doc>();
    recordEdit(o, setDone);      // drag-to-Done → PUT dispatched
    markSubmitted(o);            // submittedLen = 1 (the losing snapshot)
    recordEdit(o, checkSubtask); // subtask checked during the in-flight window
    abandonInFlight(o);          // the PUT 409'd — nothing confirmed
    expect(o.submittedLen).toBe(0);
    expect(o.updaters).toHaveLength(2); // BOTH edits retained
    const freshServerDoc: Doc = { done: false, subtask: false, other: "advanced-by-other-tab" };
    expect(replayOverlay(o, freshServerDoc)).toEqual({
      done: true, subtask: true, other: "advanced-by-other-tab",
    });
  });

  it("abandonInFlight clears only the boundary, so a stray later 'saved' is inert", () => {
    const o = createOverlay<Doc>();
    recordEdit(o, setDone);
    markSubmitted(o);
    abandonInFlight(o);
    confirmSaved(o);             // out-of-order stray confirmation
    expect(o.updaters).toHaveLength(1); // still retained — not wrongly dropped
  });
});

describe("coalescing — multiple submits before one confirmation", () => {
  it("uses the LATEST submit boundary when the queue coalesced newer snapshots", () => {
    const o = createOverlay<Doc>();
    recordEdit(o, setDone);
    recordEdit(o, checkSubtask);
    markSubmitted(o);                    // submittedLen = 2 (first send)
    recordEdit(o, (p) => ({ ...p, other: "edited" }));
    markSubmitted(o);                    // submittedLen = 3 (coalesced newer send)
    expect(o.submittedLen).toBe(3);
    confirmSaved(o);                     // "saved" fires once for the newest snapshot
    expect(o.updaters).toEqual([]);      // all three confirmed & dropped
  });

  it("debounce race: an edit appended after submit but before its 'saved' survives", () => {
    const o = createOverlay<Doc>();
    recordEdit(o, setDone);
    recordEdit(o, checkSubtask);
    markSubmitted(o);                    // submittedLen = 2
    recordEdit(o, (p) => ({ ...p, other: "still-debouncing" })); // no markSubmitted yet
    confirmSaved(o);                     // the len-2 snapshot confirmed
    expect(o.updaters).toHaveLength(1);  // the still-debouncing edit is kept
    expect(replayOverlay(o, seed())).toEqual({ done: false, subtask: false, other: "still-debouncing" });
  });
});

const advance = (p: Doc): Doc => ({ ...p, other: "advanced-by-other-tab" });

describe("CR4 — pre-load edit survives the first post-load persist 409", () => {
  // Models the pending→overlay handoff the initial load() now performs: it copies
  // the pre-load updaters INTO the overlay (recordEdit) so a first-save 409
  // replays them, instead of only folding them into `merged` and losing them.
  it("a pre-load edit is replayed on the recovery re-GET after a first-save 409", () => {
    const o = createOverlay<Doc>();
    const pending = [setDone]; // one pre-load optimistic edit, buffered before the GET

    // --- initial load resolves: fold pending into the (empty) overlay, replay once
    for (const p of pending) recordEdit(o, p);
    const base: Doc = seed();
    const merged = replayOverlay(o, base);
    expect(merged).toEqual({ done: true, subtask: false, other: "server" }); // applied exactly once
    expect(overlayHasEdits(o)).toBe(true); // the fix: it now lives in the recoverable overlay

    // --- first post-load persist submits `merged`, then 409s (another tab advanced)
    markSubmitted(o);       // the submitted snapshot carries the whole overlay (len 1)
    abandonInFlight(o);     // 409: nothing confirmed, keep the updater
    expect(o.updaters).toHaveLength(1);

    // --- recovery re-GETs the advanced server doc (which does NOT contain our edit)
    const advancedServer: Doc = { done: false, subtask: false, other: "advanced" };
    const recovered = replayOverlay(o, advancedServer);
    expect(recovered).toEqual({ done: true, subtask: false, other: "advanced" }); // pre-load edit SURVIVES
  });

  it("on the successful first-save path the pre-load edit is dropped (not double-applied later)", () => {
    const o = createOverlay<Doc>();
    for (const p of [setDone]) recordEdit(o, p); // initial load folds pending into overlay
    markSubmitted(o);   // first persist submits merged (server accepts)
    confirmSaved(o);    // "saved": drop the confirmed prefix
    expect(overlayHasEdits(o)).toBe(false);
    // A LATER conflict must not re-apply it: server already has it, replay is a no-op.
    const laterServer: Doc = { done: true, subtask: false, other: "advanced" };
    expect(replayOverlay(o, laterServer)).toEqual(laterServer);
  });
});

describe("CR2 — a failed recovery re-GET must not permanently wedge the hook", () => {
  it("retries with bounded exponential backoff, then re-enables writes", () => {
    // Walk the recovery decision the way the hook's catch does: keep re-GETting
    // under the cap, then fall back to re-enabling writes.
    const delays: number[] = [];
    let attempt = 0;
    let reenabled = false;
    for (let i = 0; i < RECOVERY_MAX_RETRIES + 3; i++) {
      const step = nextRecoveryStep(attempt);
      if (step.action === "retry") { delays.push(step.delay); attempt = step.attempt; }
      else { reenabled = true; break; }
    }
    expect(delays).toEqual([500, 1000, 2000, 4000, 8000]); // capped at 8000, exactly MAX retries
    expect(reenabled).toBe(true);                          // never loops forever → hook unwedges
  });

  it("recoveryRetryDelay caps the backoff and never goes negative", () => {
    expect(recoveryRetryDelay(0)).toBe(500);
    expect(recoveryRetryDelay(4)).toBe(8000);
    expect(recoveryRetryDelay(10)).toBe(8000); // capped
    expect(recoveryRetryDelay(-1)).toBe(500);   // defensive: never < the first delay
  });

  it("no edit is lost across the failed-recovery window: the overlay keeps every unconfirmed edit", () => {
    // An edit is recorded, its save 409s (abandonInFlight keeps it), the recovery
    // re-GET then FAILS repeatedly. The overlay must still hold the edit so that
    // when writes are re-enabled and a later re-GET succeeds it replays + persists.
    const o = createOverlay<Doc>();
    recordEdit(o, setDone);
    markSubmitted(o);
    abandonInFlight(o);                       // the 409 that triggered recovery
    // ...N failed re-GETs happen (pure policy, no overlay mutation) ...
    let attempt = 0;
    for (let step = nextRecoveryStep(attempt); step.action === "retry"; step = nextRecoveryStep(attempt)) {
      attempt = step.attempt;
    }
    expect(o.updaters).toHaveLength(1);       // edit never dropped during the wedge window
    // writes re-enabled; a subsequent successful re-GET replays it on the fresh doc
    expect(replayOverlay(o, advance(seed()))).toEqual({ done: true, subtask: false, other: "advanced-by-other-tab" });
  });
});

describe("CR3 — bfcache restore must not double-apply a keepalive-flushed edit", () => {
  it("planBfcacheResync adopts the server only when a flush advanced past its base", () => {
    // keepalive flushed at base 4, server now 5 → our PUT landed → adopt server.
    expect(planBfcacheResync({ keepaliveFlushed: true, flushedBase: 4, serverVersion: 5 })).toBe("adopt-server");
    // keepalive flushed but server still at base → nothing landed → replay overlay.
    expect(planBfcacheResync({ keepaliveFlushed: true, flushedBase: 4, serverVersion: 4 })).toBe("replay-overlay");
    // no keepalive was sent → never adopt (would drop genuinely-unsent edits).
    expect(planBfcacheResync({ keepaliveFlushed: false, flushedBase: 4, serverVersion: 9 })).toBe("replay-overlay");
  });

  it("adopt-server drops the still-present overlay updater so it is NOT re-applied", () => {
    // Repro: edit recorded in the overlay, pagehide keepalive-flushes the full doc
    // (overlay NOT cleared, base NOT advanced). On bfcache restore the refs survive.
    const o = createOverlay<Doc>();
    recordEdit(o, (p) => ({ ...p, other: `${p.other}+entry` })); // NON-idempotent updater
    const flushedBase = 4;

    // resync re-GETs: server advanced to 5 and already contains "+entry".
    const serverVersion = 5;
    const serverDoc: Doc = { done: false, subtask: false, other: "server+entry" };
    const plan = planBfcacheResync({ keepaliveFlushed: true, flushedBase, serverVersion });
    expect(plan).toBe("adopt-server");

    resetOverlay(o);                          // the fix: clear the already-sent overlay
    // Had we replayed instead, we'd get "server+entry+entry" — the double-apply bug.
    expect(replayOverlay(o, serverDoc)).toEqual(serverDoc); // adopted verbatim, no duplicate entry
    expect(overlayHasEdits(o)).toBe(false);
  });

  it("replay-overlay recovers the edit when the flush did NOT land (no drop)", () => {
    const o = createOverlay<Doc>();
    recordEdit(o, setDone);
    // resync re-GETs: server still at the base we flushed with → flush was lost.
    const plan = planBfcacheResync({ keepaliveFlushed: true, flushedBase: 4, serverVersion: 4 });
    expect(plan).toBe("replay-overlay");
    const serverDoc: Doc = { done: false, subtask: false, other: "server" };
    expect(replayOverlay(o, serverDoc)).toEqual({ done: true, subtask: false, other: "server" }); // edit restored
  });
});

describe("stale-base guard — isRecovering", () => {
  it("(c) reports recovery-in-progress from the loaded flag", () => {
    expect(isRecovering(false)).toBe(true);  // loadedRef flipped false → mid-recovery → skip submit
    expect(isRecovering(true)).toBe(false);  // writes enabled → submit may proceed
  });

  it("(c) a debounce timer that fires mid-recovery does not submit a stale base", () => {
    // Model the guarded timer callback: skip while recovering, else mark+submit.
    const o = createOverlay<Doc>();
    recordEdit(o, setDone);
    let submits = 0;
    const firedTimer = (loaded: boolean) => {
      if (isRecovering(loaded)) return;
      markSubmitted(o);
      submits++;
    };

    firedTimer(false); // timer armed pre-conflict, fires while recovery outstanding
    expect(submits).toBe(0);          // no spurious second 409
    expect(o.submittedLen).toBe(0);   // boundary untouched

    firedTimer(true);  // recovery finished, writes re-enabled
    expect(submits).toBe(1);
    expect(o.submittedLen).toBe(1);
  });
});
