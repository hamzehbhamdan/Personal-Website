// lib/dashboard/useAppState.ts
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { SaveQueue, ConflictError, TooLargeError, type SaveStatus } from "@/lib/dashboard/state-sync";
import { fitsKeepalive } from "@/lib/dashboard/keepalive";
import {
  createOverlay,
  recordEdit,
  markSubmitted,
  confirmSaved,
  abandonInFlight,
  replayOverlay,
  overlayHasEdits,
  resetOverlay,
  nextRecoveryStep,
  planBfcacheResync,
} from "@/lib/dashboard/edit-overlay";

export function useAppState<T extends object>(app: "lifeCRM" | "execCoach" | "home" | "brain", seed: T) {
  const [state, setState] = useState<T>(seed);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [status, setStatus] = useState<"idle" | SaveStatus>("idle");

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seedRef = useRef(seed);                       // stable base for replay
  const appRef = useRef(app);
  useEffect(() => { appRef.current = app; }, [app]);
  const loadedRef = useRef(false);        // writes enabled; flips false DURING conflict recovery
  const everLoadedRef = useRef(false);    // monotonic: the initial GET has resolved at least once
  const aliveRef = useRef(true);
  const pendingRef = useRef<Array<(prev: T) => T>>([]); // pre-(first-)load optimistic edits
  const overlayRef = useRef(createOverlay<T>());        // post-load edits not yet confirmed on the server
  const latestRef = useRef<T>(seed);                   // newest snapshot for the queue
  const loadRef = useRef<() => void>(() => {});        // conflict re-GET indirection (queue built before load runs)
  const resyncRef = useRef<() => void>(() => {});      // bfcache-restore resync indirection (pageshow handler)
  // CR2: bounded auto-retry of a FAILED recovery re-GET so writes are never
  // permanently disabled. Counts retries this recovery cycle; the pending timer.
  const recoveryAttemptRef = useRef(0);
  const recoveryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // CR3: the pagehide keepalive PUT is fire-and-forget on this base; on a bfcache
  // restore we use these to tell "our flush landed" (adopt server) from "nothing
  // landed" (replay overlay) — see planBfcacheResync.
  const keepaliveFlushedRef = useRef(false);
  const flushedBaseRef = useRef(0);

  // Stable-for-the-component-lifetime singleton. Constructed inside an effect
  // (not render) so React Compiler's react-hooks/refs rule doesn't flag the
  // `.current` write / ref capture happening during render.
  const queueRef = useRef<SaveQueue<T> | null>(null);
  useEffect(() => {
    if (!queueRef.current) {
      queueRef.current = new SaveQueue<T>(
        async (doc, baseVersion) => {
          // Optimistic-lock PUT: carries the base version we loaded/last saved.
          // 409 ⇒ someone else advanced the doc ⇒ ConflictError (never retried);
          // 413 ⇒ doc over the size cap ⇒ TooLargeError (never retried — the same
          // oversize body would 413 again); any other non-2xx ⇒ generic
          // (retryable) failure. Success resolves the server's new version so the
          // queue stores it as the next base.
          const r = await fetch(`/api/state?app=${appRef.current}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: doc, baseVersion }),
          });
          if (r.status === 409) throw new ConflictError();
          if (r.status === 413) throw new TooLargeError();
          if (!r.ok) throw new Error("save failed");
          const j = await r.json().catch(() => null);
          return typeof j?.version === "number" ? j.version : undefined;
        },
        (s) => {
          if (!aliveRef.current) return;
          setStatus(s);
          if (s === "saved") {
            // The submitted snapshot is on the server. Drop exactly the edits it
            // carried (the submittedLen prefix); edits appended after that submit
            // but before this confirmation stay in the overlay for a future
            // recovery — clearing the whole overlay here would silently drop them.
            confirmSaved(overlayRef.current);
          } else if (s === "conflict") {
            // Another tab/device advanced the doc. Block further writes and
            // re-GET the fresh doc + version. The conflicting payload is NOT
            // replayed; instead the still-unconfirmed post-load edits (overlayRef)
            // and any edits made during the re-GET replay on top of the fresh doc
            // and are re-persisted on the new base — see load(). The in-flight
            // snapshot was NOT confirmed, so clear its submit boundary.
            abandonInFlight(overlayRef.current);
            loadedRef.current = false;
            loadRef.current();
          }
        },
      );
    }
  }, []);

  // Debounced save. Pre-load writes never reach the wire: they sit in
  // pendingRef until the GET resolves (see load below). By the time this can
  // fire, `loadedRef.current` is true, which only happens after the mount
  // effect above has run and constructed queueRef.current.
  const persist = useCallback((next: T) => {
    latestRef.current = next;
    if (!loadedRef.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      // Stale-base guard: a timer armed before a 409 must not fire mid-recovery.
      // loadedRef flips false the instant the conflict lands; submitting now
      // would carry the pre-conflict base and 409 again (a redundant recovery).
      // The recovery's own re-persist re-arms this timer on the fresh base.
      if (!loadedRef.current) return;
      markSubmitted(overlayRef.current); // boundary: this snapshot carries the whole overlay
      queueRef.current!.submit(latestRef.current);
    }, 500);
  }, []);

  // Note: does not reset loadError synchronously on entry — the initial mount
  // call runs inside a useEffect, and calling setState synchronously there
  // would trigger an extra cascading render (flagged by react-hooks/set-state
  // -in-effect). retryLoad() clears loadError itself before calling load().
  // Doubles as the conflict-recovery re-GET (via loadRef): re-reads the doc,
  // refreshes the queue's base version, and re-enables writes.
  const load = useCallback(() => {
    let alive = true;
    fetch(`/api/state?app=${appRef.current}`)
      .then((r) => { if (!r.ok) throw new Error(`load failed: ${r.status}`); return r.json(); })
      .then((j) => {
        const version = typeof j.version === "number" ? j.version : 0;
        const base = j.data && Object.keys(j.data).length ? (j.data as T) : seedRef.current;
        const pending = pendingRef.current;
        pendingRef.current = [];
        const overlay = overlayRef.current;
        // CR4: fold the pre-(first-)load buffer INTO the recoverable overlay,
        // then replay the overlay ONCE on the fresh server doc. Previously the
        // pending updaters were only replayed into `merged` and never copied to
        // the overlay, so if the FIRST post-load persist 409'd, the recovery
        // re-GET replayed an EMPTY overlay and the pre-load edit vanished from UI
        // and server. Copying them in makes them survive a first-save 409 exactly
        // like post-load edits, and confirmSaved drops them on the confirmed save.
        // Safe against double-apply: `pending` is only non-empty on the very
        // first load, when the overlay is still empty (the two buffers are
        // temporally disjoint), so this appends — it never re-applies an edit the
        // overlay already holds, and merged replays the overlay a single time.
        for (const p of pending) recordEdit(overlay, p);
        const merged = replayOverlay(overlay, base);
        const buffered = overlayHasEdits(overlay);
        if (!alive || !aliveRef.current) {
          // Component unmounted before the GET resolved (e.g. a quick
          // edit-then-navigate on a per-view hook). Don't touch React state,
          // but buffered edits must STILL reach the server exactly once —
          // otherwise the buffered edit is silently dropped. Refresh the base
          // to the just-loaded version FIRST so the PUT is a well-formed
          // optimistic write; the queue's PUT is React-free and its onStatus
          // is guarded by aliveRef, so this is safe post-unmount.
          if (buffered) {
            queueRef.current?.setBase(version);
            markSubmitted(overlay);
            queueRef.current?.submit(merged);
          }
          return;
        }
        queueRef.current?.setBase(version); // initialize/refresh the optimistic-lock base
        loadedRef.current = true;
        everLoadedRef.current = true;
        recoveryAttemptRef.current = 0;     // a re-GET succeeded: reset the CR2 backoff
        keepaliveFlushedRef.current = false; // reconciled with the server; no stale flush pending
        latestRef.current = merged;
        setState(merged);
        setLoaded(true);
        // Buffered edits reach the server exactly once. On a conflict recovery
        // this re-persists the overlay on the fresh base; its "saved" then clears
        // the overlay via confirmSaved.
        if (buffered) persist(merged);
      })
      .catch(() => {
        if (!alive || !aliveRef.current) return;
        if (!everLoadedRef.current) { setLoadError(true); return; } // initial load: retry UI is reachable (loaded is FALSE)
        // CR2: a conflict-recovery re-GET failed. `loaded` is still TRUE, so the
        // LoadState/Retry UI is unreachable AND writes are disabled (loadedRef
        // false) — the hook would be permanently wedged, edits piling silently
        // into the overlay. Never wedge: retry the re-GET with bounded backoff,
        // and once exhausted re-enable writes so a stale-base re-persist (and any
        // future edit) re-triggers recovery when connectivity returns. The
        // overlay keeps every unconfirmed edit throughout, so nothing is lost.
        const step = nextRecoveryStep(recoveryAttemptRef.current);
        if (step.action === "retry") {
          recoveryAttemptRef.current = step.attempt;
          if (recoveryTimerRef.current) clearTimeout(recoveryTimerRef.current);
          recoveryTimerRef.current = setTimeout(() => {
            recoveryTimerRef.current = null;
            if (aliveRef.current) loadRef.current(); // re-GET again (still recovering: loadedRef false)
          }, step.delay);
        } else {
          recoveryAttemptRef.current = 0;
          loadedRef.current = true;               // re-enable writes: unwedge
          if (overlayHasEdits(overlayRef.current)) persist(latestRef.current); // re-attempt now
        }
      });
    return () => { alive = false; };
  }, [persist]);

  // CR3: reconcile after a bfcache restore (pageshow persisted=true). The page
  // was FROZEN, not torn down: React did not remount, so all refs — the stale
  // queue base and the overlay still holding the keepalive-flushed updater —
  // survived. A plain recovery load() would replay that already-sent updater on
  // top of the server doc that already contains it (double-apply). Re-GET the
  // authoritative server doc/version and, per planBfcacheResync, either ADOPT it
  // (flush landed → drop the overlay, no replay) or REPLAY the overlay + re-persist
  // (nothing landed → recover the buffered edits). Failure is handled like a
  // recovery re-GET failure: re-enable writes rather than wedge.
  const resync = useCallback(() => {
    fetch(`/api/state?app=${appRef.current}`)
      .then((r) => { if (!r.ok) throw new Error(`resync failed: ${r.status}`); return r.json(); })
      .then((j) => {
        if (!aliveRef.current) return;
        const version = typeof j.version === "number" ? j.version : 0;
        const serverDoc = j.data && Object.keys(j.data).length ? (j.data as T) : seedRef.current;
        const overlay = overlayRef.current;
        const plan = planBfcacheResync({
          keepaliveFlushed: keepaliveFlushedRef.current,
          flushedBase: flushedBaseRef.current,
          serverVersion: version,
        });
        keepaliveFlushedRef.current = false;
        recoveryAttemptRef.current = 0;
        queueRef.current?.setBase(version);
        loadedRef.current = true; // resync always re-enables writes on the fresh base
        if (plan === "adopt-server") {
          // The keepalive PUT advanced the server past the base we flushed with:
          // the fresh doc already reflects our edit. Drop the overlay so replay
          // can't double-apply it, and adopt the server doc verbatim.
          resetOverlay(overlay);
          latestRef.current = serverDoc;
          setState(serverDoc);
        } else {
          // Nothing we sent landed — replay the still-unconfirmed overlay on the
          // fresh doc and re-persist so the buffered edits are not dropped.
          const merged = replayOverlay(overlay, serverDoc);
          latestRef.current = merged;
          setState(merged);
          if (overlayHasEdits(overlay)) persist(merged);
        }
      })
      .catch(() => { if (aliveRef.current) loadedRef.current = true; }); // never wedge on a resync failure
  }, [persist]);

  // Keep the conflict-recovery indirection pointed at the current load. The
  // queue's onStatus closure captures loadRef (stable), so it never goes stale.
  useEffect(() => { loadRef.current = () => { void load(); }; }, [load]);
  useEffect(() => { resyncRef.current = () => { resync(); }; }, [resync]);

  useEffect(() => {
    aliveRef.current = true;
    const overlay = overlayRef.current; // stable object ref for the component lifetime
    const cancel = load();
    return () => {
      cancel();
      aliveRef.current = false;
      if (recoveryTimerRef.current) { clearTimeout(recoveryTimerRef.current); recoveryTimerRef.current = null; }
      // Flush an in-window edit instead of dropping it (view-switch unmounts).
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
        if (loadedRef.current) {
          markSubmitted(overlay);
          queueRef.current!.submit(latestRef.current);
        }
      }
    };
  }, [load]);

  // Tab-close flush (finding #39 residual): an edit still inside the 500ms
  // debounce window when the tab closes would otherwise be lost. keepalive
  // survives page teardown but caps the body at 64KB — larger docs fall back
  // to a normal queue submit (fires fully on bfcache navigations; usually dies
  // with the page on a real close — the documented residual gap in keepalive.ts).
  // Both paths carry baseVersion, so the server never silently overwrites: a
  // racing/stale flush 409s and the next mount's load self-heals.
  useEffect(() => {
    const flush = () => {
      if (!loadedRef.current || !timer.current) return; // nothing sitting in the debounce window
      clearTimeout(timer.current);
      timer.current = null;
      const flushedBase = queueRef.current!.baseVersion;
      const body = JSON.stringify({ data: latestRef.current, baseVersion: flushedBase });
      if (fitsKeepalive(body)) {
        // Direct keepalive PUT — bypasses the queue, so no "saved" fires and the
        // overlay is NOT cleared here (the response is never read during unload).
        // On a real close the page dies and it is moot; on a bfcache freeze the
        // refs survive, so record that we flushed at `flushedBase` — the pageshow
        // resync (CR3) uses this to avoid double-applying the still-present
        // overlay updater once the server advances past this base.
        keepaliveFlushedRef.current = true;
        flushedBaseRef.current = flushedBase;
        void fetch(`/api/state?app=${appRef.current}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          body,
        }).catch(() => {});
      } else {
        markSubmitted(overlayRef.current);
        queueRef.current!.submit(latestRef.current);
      }
    };
    // bfcache restore: the page was frozen with a stale base + unflushed overlay;
    // reconcile with the server so a keepalive-flushed edit isn't double-applied.
    const restore = (e: PageTransitionEvent) => { if (e.persisted) resyncRef.current(); };
    window.addEventListener("pagehide", flush);
    window.addEventListener("pageshow", restore);
    return () => {
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("pageshow", restore);
    };
  }, []);

  const update = useCallback((updater: (prev: T) => T) => {
    // Recorded once, outside setState. Pre-(first-)load edits buffer in
    // pendingRef (replayed by the initial load). Every edit AFTER the first load
    // — including ones made during a conflict recovery, when loadedRef is
    // transiently false — goes into the overlay so recovery can replay and
    // re-persist it. everLoadedRef distinguishes the two false-loadedRef windows.
    if (everLoadedRef.current) recordEdit(overlayRef.current, updater);
    else pendingRef.current.push(updater);
    setState((prev) => {
      const next = updater(prev);
      latestRef.current = next;
      if (loadedRef.current) persist(next); // recovery window defers persist to load()'s re-persist
      return next;
    });
  }, [persist]);

  const retryLoad = useCallback(() => {
    setLoadError(false); // called from a click handler, not synchronously in an effect
    void load();
  }, [load]);

  return { state, setState: update, loaded, loadError, retryLoad, status };
}
