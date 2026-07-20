// lib/dashboard/useAppState.ts
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { SaveQueue, replayPending, ConflictError, type SaveStatus } from "@/lib/dashboard/state-sync";
import { fitsKeepalive } from "@/lib/dashboard/keepalive";
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
          // any other non-2xx ⇒ generic (retryable) failure. Success resolves
          // the server's new version so the queue stores it as the next base.
          const r = await fetch(`/api/state?app=${appRef.current}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: doc, baseVersion }),
          });
          if (r.status === 409) throw new ConflictError();
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
      if (isRecovering(loadedRef.current)) return;
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
        // Rebuild on top of the fresh server doc: first the pre-(first-)load
        // buffer, then the still-unconfirmed post-load overlay. On the initial
        // load the overlay is empty; on a conflict re-GET `pending` is empty and
        // the overlay carries the edits that must survive recovery. The two
        // buffers are temporally disjoint (pending strictly before the first
        // load, overlay strictly after), so the combined order is chronological.
        const merged = replayOverlay(overlay, replayPending(base, pending));
        const buffered = pending.length > 0 || overlayHasEdits(overlay);
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
        latestRef.current = merged;
        setState(merged);
        setLoaded(true);
        // Buffered edits reach the server exactly once. On a conflict recovery
        // this re-persists the overlay on the fresh base; its "saved" then clears
        // the overlay via confirmSaved.
        if (buffered) persist(merged);
      })
      .catch(() => { if (alive && aliveRef.current) setLoadError(true); }); // loaded stays FALSE
    return () => { alive = false; };
  }, [persist]);

  // Keep the conflict-recovery indirection pointed at the current load. The
  // queue's onStatus closure captures loadRef (stable), so it never goes stale.
  useEffect(() => { loadRef.current = () => { void load(); }; }, [load]);

  useEffect(() => {
    aliveRef.current = true;
    const overlay = overlayRef.current; // stable object ref for the component lifetime
    const cancel = load();
    return () => {
      cancel();
      aliveRef.current = false;
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
      const body = JSON.stringify({ data: latestRef.current, baseVersion: queueRef.current!.baseVersion });
      if (fitsKeepalive(body)) {
        // Direct keepalive PUT — bypasses the queue, so no "saved" fires and the
        // overlay is not cleared here; the page is tearing down so it is moot.
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
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
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
