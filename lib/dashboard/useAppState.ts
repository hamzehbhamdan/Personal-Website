"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export function useAppState<T extends object>(app: "lifeCRM" | "execCoach" | "home" | "brain", seed: T) {
  const [state, setState] = useState<T>(seed);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const genRef = useRef(0);

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
      const gen = ++genRef.current;              // capture this save's generation
      setStatus("saving");
      const put = () =>
        fetch(`/api/state?app=${app}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: next }),
        }).then((r) => { if (!r.ok) throw new Error("save failed"); });
      put()
        .catch(() => put())                       // one retry on failure (network or non-2xx)
        .then(
          () => { if (genRef.current === gen) setStatus("saved"); },
          () => { if (genRef.current === gen) setStatus("error"); },
        );
    }, 500);
  }, [app]);

  const update = useCallback((updater: (prev: T) => T) => {
    setState((prev) => { const next = updater(prev); persist(next); return next; });
  }, [persist]);

  return { state, setState: update, loaded, status };
}
