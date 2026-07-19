// lib/dashboard/useAppState.ts
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { SaveQueue, replayPending, type SaveStatus } from "@/lib/dashboard/state-sync";

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

  // Stable-for-the-component-lifetime singleton. Constructed inside an effect
  // (not render) so React Compiler's react-hooks/refs rule doesn't flag the
  // `.current` write / ref capture happening during render.
  const queueRef = useRef<SaveQueue<T> | null>(null);
  useEffect(() => {
    if (!queueRef.current) {
      queueRef.current = new SaveQueue<T>(
        (doc) =>
          fetch(`/api/state?app=${appRef.current}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: doc }),
          }).then((r) => { if (!r.ok) throw new Error("save failed"); }),
        (s) => { if (aliveRef.current) setStatus(s); },
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
  const load = useCallback(() => {
    let alive = true;
    fetch(`/api/state?app=${appRef.current}`)
      .then((r) => { if (!r.ok) throw new Error(`load failed: ${r.status}`); return r.json(); })
      .then((j) => {
        const base = j.data && Object.keys(j.data).length ? (j.data as T) : seedRef.current;
        const pending = pendingRef.current;
        pendingRef.current = [];
        const merged = replayPending(base, pending);
        if (!alive || !aliveRef.current) {
          // Component unmounted before the GET resolved (e.g. a quick
          // edit-then-navigate on a per-view hook). Don't touch React state,
          // but pre-load edits must STILL reach the server exactly once —
          // otherwise the buffered edit is silently dropped. The queue's PUT
          // is React-free and its onStatus is guarded by aliveRef, so this is
          // safe post-unmount.
          if (pending.length) queueRef.current?.submit(merged);
          return;
        }
        loadedRef.current = true;
        latestRef.current = merged;
        setState(merged);
        setLoaded(true);
        if (pending.length) persist(merged); // pre-load edits reach the server exactly once
      })
      .catch(() => { if (alive && aliveRef.current) setLoadError(true); }); // loaded stays FALSE
    return () => { alive = false; };
  }, [persist]);

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
