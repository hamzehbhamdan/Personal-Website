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
  isRecovering,
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
