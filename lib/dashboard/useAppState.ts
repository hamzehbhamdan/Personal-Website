// lib/dashboard/useAppState.ts
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { SaveQueue, replayPending, ConflictError, type SaveStatus } from "@/lib/dashboard/state-sync";
import { fitsKeepalive } from "@/lib/dashboard/keepalive";

export function useAppState<T extends object>(app: "lifeCRM" | "execCoach" | "home" | "brain", seed: T) {
  const [state, setState] = useState<T>(seed);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [status, setStatus] = useState<"idle" | SaveStatus>("idle");

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seedRef = useRef(seed);                       // stable base for replay
  const appRef = useRef(app);
  useEffect(() => { appRef.current = app; }, [app]);
  const loadedRef = useRef(false);
  const aliveRef = useRef(true);
  const pendingRef = useRef<Array<(prev: T) => T>>([]); // pre-load optimistic edits
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
          if (s === "conflict") {
            // Another tab/device advanced the doc. Block further writes and
            // re-GET the fresh doc + version. The conflicting payload is NOT
            // replayed; edits made during the re-GET buffer in pendingRef (as
            // usual while loadedRef is false) and replay on top of the fresh
            // doc. `loaded` stays true so no skeleton flash — see load().
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
        const merged = replayPending(base, pending);
        if (!alive || !aliveRef.current) {
          // Component unmounted before the GET resolved (e.g. a quick
          // edit-then-navigate on a per-view hook). Don't touch React state,
          // but pre-load edits must STILL reach the server exactly once —
          // otherwise the buffered edit is silently dropped. Refresh the base
          // to the just-loaded version FIRST so the PUT is a well-formed
          // optimistic write; the queue's PUT is React-free and its onStatus
          // is guarded by aliveRef, so this is safe post-unmount.
          if (pending.length) {
            queueRef.current?.setBase(version);
            queueRef.current?.submit(merged);
          }
          return;
        }
        queueRef.current?.setBase(version); // initialize/refresh the optimistic-lock base
        loadedRef.current = true;
        latestRef.current = merged;
        setState(merged);
        setLoaded(true);
        if (pending.length) persist(merged); // pre-load edits reach the server exactly once
      })
      .catch(() => { if (alive && aliveRef.current) setLoadError(true); }); // loaded stays FALSE
    return () => { alive = false; };
  }, [persist]);

  // Keep the conflict-recovery indirection pointed at the current load. The
  // queue's onStatus closure captures loadRef (stable), so it never goes stale.
  useEffect(() => { loadRef.current = () => { void load(); }; }, [load]);

  useEffect(() => {
    aliveRef.current = true;
    const cancel = load();
    return () => {
      cancel();
      aliveRef.current = false;
      // Flush an in-window edit instead of dropping it (view-switch unmounts).
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
        if (loadedRef.current) queueRef.current!.submit(latestRef.current);
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
        void fetch(`/api/state?app=${appRef.current}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          body,
        }).catch(() => {});
      } else {
        queueRef.current!.submit(latestRef.current);
      }
    };
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, []);

  const update = useCallback((updater: (prev: T) => T) => {
    if (!loadedRef.current) pendingRef.current.push(updater); // recorded once, outside setState
    setState((prev) => {
      const next = updater(prev);
      latestRef.current = next;
      if (loadedRef.current) persist(next);
      return next;
    });
  }, [persist]);

  const retryLoad = useCallback(() => {
    setLoadError(false); // called from a click handler, not synchronously in an effect
    void load();
  }, [load]);

  return { state, setState: update, loaded, loadError, retryLoad, status };
}
