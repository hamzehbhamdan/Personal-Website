"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export function useAppState<T extends object>(app: "lifeCRM" | "execCoach", seed: T) {
  const [state, setState] = useState<T>(seed);
  const [loaded, setLoaded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/state?app=${app}`)
      .then((r) => (r.ok ? r.json() : { data: {} }))
      .then((j) => { if (alive) { if (j.data && Object.keys(j.data).length) setState(j.data as T); setLoaded(true); } })
      .catch(() => alive && setLoaded(true));
    return () => { alive = false; };
  }, [app]);

  // v1 trade-off: a mutation made within the 500ms debounce window immediately before
  // unmount is dropped rather than flushed; flush-on-unmount is a later (B/C) concern.
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const persist = useCallback((next: T) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      fetch(`/api/state?app=${app}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: next }),
      }).catch(() => {});
    }, 500);
  }, [app]);

  const update = useCallback((updater: (prev: T) => T) => {
    setState((prev) => { const next = updater(prev); persist(next); return next; });
  }, [persist]);

  return { state, setState: update, loaded };
}
