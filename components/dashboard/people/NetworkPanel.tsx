"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmDB } from "@/lib/dashboard/people/types";
import { step, seedPositions, createSettleTracker, type SimNode } from "@/lib/dashboard/people/graph-sim";
import { canonEdge, edgeKey, neighbors, removeEdge, shortestPath } from "@/lib/dashboard/people/connections";
import { tierColor } from "@/lib/dashboard/people/tiers";
import { normalizeDb } from "@/lib/dashboard/people/backup";

const mono = { fontFamily: "var(--font-geist-mono), monospace" };
const serif = { fontFamily: "var(--font-playfair), Georgia, serif" };
const W = 920;
const H = 560;
const R = 21; // node radius

export function NetworkPanel({ db, setState, onOpenContact, onOpenLink }: {
  db: CrmDB;
  setState: (fn: (prev: CrmDB) => CrmDB) => void;
  onOpenContact: (id: string) => void;
  onOpenLink: () => void;
}) {
  const contacts = db.contacts;
  const edges = db.connections;
  const contactById = useMemo(() => new Map(contacts.map((c) => [c.id, c])), [contacts]);

  const [nodes, setNodes] = useState<SimNode[]>([]);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [hover, setHover] = useState<string | null>(null);
  const [pathFrom, setPathFrom] = useState("");
  const [pathTo, setPathTo] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; moved: boolean } | null>(null);
  const pan = useRef<{ x: number; y: number } | null>(null);
  // Restarts the relaxation loop after it has gone to sleep. The loop effect
  // below installs the real implementation; no-op until it mounts.
  const wakeRef = useRef<() => void>(() => {});

  // Sync sim nodes with the contact set (keep positions for existing, seed new), then pre-warm.
  useEffect(() => {
    setNodes((prev) => {
      const byId = new Map(prev.map((n) => [n.id, n]));
      const ids = contacts.map((c) => c.id);
      // Clone kept nodes before stepping: step() mutates in place and these
      // objects are still referenced by current React state (review #58).
      const kept = ids.filter((id) => byId.has(id)).map((id) => ({ ...byId.get(id)! }));
      const seeded = seedPositions(ids.filter((id) => !byId.has(id)), W / 2, H / 2);
      const all = [...kept, ...seeded];
      for (let i = 0; i < 160; i++) step(all, edges, { centerX: W / 2, centerY: H / 2, friction: 0.9 });
      return all;
    });
    wakeRef.current(); // node added/removed/edited — let the layout re-settle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contacts]);

  // Live relaxation loop. Steps the sim each animation frame until the layout
  // settles (per-node displacement below SETTLE_EPS for SETTLE_FRAMES straight
  // frames), then stops scheduling entirely. wakeRef.current() restarts it —
  // wired to drag start/move/end, the contact-sync effect, and (via this
  // effect's [edges] dependency) every connection add/remove.
  useEffect(() => {
    let raf = 0;
    let running = false;
    let disposed = false;
    const settle = createSettleTracker();
    const tick = () => {
      if (disposed || settle.settled()) {
        running = false;
        return;
      }
      setNodes((prev) => {
        if (!prev.length) {
          settle.update(0, 0); // empty graph: count calm frames, then sleep
          return prev; // same reference — React bails out, no re-render
        }
        const next = prev.map((n) => ({ ...n }));
        const disp = step(next, edges, { centerX: W / 2, centerY: H / 2, friction: 0.92 });
        settle.update(disp, next.length);
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (disposed) return;
      settle.reset();
      if (running) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };
    wakeRef.current = wake;
    wake();
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      wakeRef.current = () => {};
    };
  }, [edges]);

  const posById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const hoverSet = useMemo(() => (hover ? new Set([hover, ...neighbors(edges, hover)]) : null), [hover, edges]);

  // Shortest-path highlight (takes precedence over hover when a route exists).
  const path = useMemo(
    () => (pathFrom && pathTo && pathFrom !== pathTo ? shortestPath(edges, pathFrom, pathTo) : null),
    [pathFrom, pathTo, edges],
  );
  const pathNodes = useMemo(() => (path ? new Set(path) : null), [path]);
  const pathEdgeKeys = useMemo(() => {
    const s = new Set<string>();
    if (path) for (let i = 0; i < path.length - 1; i++) {
      const e = canonEdge(path[i], path[i + 1]);
      if (e) s.add(edgeKey(e));
    }
    return s;
  }, [path]);
  const pathQueried = !!(pathFrom && pathTo && pathFrom !== pathTo);

  function toGraph(clientX: number, clientY: number) {
    const rect = wrapRef.current!.getBoundingClientRect();
    return {
      x: (clientX - rect.left - transform.x) / transform.k,
      y: (clientY - rect.top - transform.y) / transform.k,
    };
  }

  function onNodePointerDown(e: React.PointerEvent, id: string) {
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { id, moved: false };
    wakeRef.current(); // neighbors must respond while this node is pinned
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, pinned: true } : n)));
  }
  function onNodePointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    drag.current.moved = true;
    const p = toGraph(e.clientX, e.clientY);
    const id = drag.current.id;
    wakeRef.current(); // keep the sim awake for the whole drag, not just its start
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, x: p.x, y: p.y, vx: 0, vy: 0 } : n)));
  }
  function onNodePointerUp(id: string) {
    const wasMoved = drag.current?.moved;
    drag.current = null;
    wakeRef.current(); // released node re-enters the sim; let the layout relax
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, pinned: false } : n)));
    if (!wasMoved) onOpenContact(id);
  }

  function onBgPointerDown(e: React.PointerEvent) {
    pan.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
  }
  function onBgPointerMove(e: React.PointerEvent) {
    if (!pan.current) return;
    setTransform((t) => ({ ...t, x: e.clientX - pan.current!.x, y: e.clientY - pan.current!.y }));
  }
  function onBgPointerUp() {
    pan.current = null;
  }

  function zoom(delta: number) {
    setTransform((t) => ({ ...t, k: Math.min(4, Math.max(0.3, +(t.k + delta).toFixed(2))) }));
  }

  function removeConnection(a: string, b: string) {
    const na = contactById.get(a)?.name ?? "someone", nb = contactById.get(b)?.name ?? "someone";
    if (!window.confirm(`Remove the connection between ${na} and ${nb}?`)) return;
    setState((prev) => {
      const d = normalizeDb(prev);
      return { ...d, connections: removeEdge(d.connections, a, b) };
    });
  }

  const nodeDim = (id: string) => (pathNodes ? !pathNodes.has(id) : hoverSet ? !hoverSet.has(id) : false);
  const sorted = useMemo(() => [...contacts].sort((a, b) => a.name.localeCompare(b.name)), [contacts]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[11px] text-stone-400">
          {contacts.length} people · {edges.length} connection{edges.length === 1 ? "" : "s"}
          <span className="ml-2 text-stone-300">drag to move · click a node to open · click a line to remove</span>
        </p>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-[8px] border border-stone-200">
            <button onClick={() => zoom(-0.2)} className="px-2.5 py-1 font-mono text-[13px] text-stone-500 hover:bg-stone-50" style={mono} aria-label="Zoom out">−</button>
            <button onClick={() => zoom(0.2)} className="border-l border-stone-200 px-2.5 py-1 font-mono text-[13px] text-stone-500 hover:bg-stone-50" style={mono} aria-label="Zoom in">＋</button>
          </div>
          <button
            onClick={onOpenLink}
            className="rounded-[8px] bg-[#A51C30] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white hover:bg-[#8a1728]"
            style={mono}
          >
            Connect people
          </button>
        </div>
      </div>

      {contacts.length >= 2 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px]">
          <span className="font-mono uppercase tracking-[0.14em] text-stone-400" style={mono}>Shortest path</span>
          <select value={pathFrom} onChange={(e) => setPathFrom(e.target.value)} className="rounded-[8px] border border-stone-200 bg-white px-2 py-1 text-[12px] text-stone-700">
            <option value="">From…</option>
            {sorted.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <span className="text-stone-400">→</span>
          <select value={pathTo} onChange={(e) => setPathTo(e.target.value)} className="rounded-[8px] border border-stone-200 bg-white px-2 py-1 text-[12px] text-stone-700">
            <option value="">To…</option>
            {sorted.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {pathQueried && (
            <span className={path ? "text-[#A51C30]" : "text-stone-400"}>
              {path ? `${path.length - 1} degree${path.length - 1 === 1 ? "" : "s"} of separation` : "Not connected"}
            </span>
          )}
          {(pathFrom || pathTo) && (
            <button onClick={() => { setPathFrom(""); setPathTo(""); }} className="font-mono text-[10px] uppercase tracking-[0.1em] text-stone-400 hover:text-stone-600" style={mono}>
              Clear
            </button>
          )}
        </div>
      )}

      {contacts.length === 0 ? (
        <div className="grid h-[300px] place-items-center rounded-[12px] border border-dashed border-stone-200 font-mono text-[11px] uppercase tracking-[0.16em] text-stone-300" style={mono}>
          No contacts yet
        </div>
      ) : (
        <div
          ref={wrapRef}
          className="relative h-[560px] w-full touch-none overflow-hidden rounded-[12px] border border-stone-200 bg-[#fbfaf8]"
          onPointerDown={onBgPointerDown}
          onPointerMove={onBgPointerMove}
          onPointerUp={onBgPointerUp}
          onPointerLeave={onBgPointerUp}
        >
          <div className="absolute left-0 top-0 origin-top-left" style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})` }}>
            <svg width={W} height={H} className="absolute left-0 top-0 overflow-visible">
              {edges.map((e) => {
                const a = posById.get(e.a), b = posById.get(e.b);
                if (!a || !b) return null;
                const onPath = pathEdgeKeys.has(edgeKey(e));
                const lit = pathNodes ? onPath : hoverSet ? hoverSet.has(e.a) && hoverSet.has(e.b) : true;
                return (
                  <g key={edgeKey(e)}>
                    <line
                      x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                      stroke={onPath ? "#A51C30" : lit ? "#d6cfc4" : "#ece8e1"}
                      strokeWidth={onPath ? 2.5 : 1.5}
                    />
                    <line
                      x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                      stroke="transparent" strokeWidth={12} className="cursor-pointer"
                      onPointerDown={(ev) => ev.stopPropagation()}
                      onClick={() => removeConnection(e.a, e.b)}
                    />
                  </g>
                );
              })}
            </svg>
            {nodes.map((n) => {
              const c = contactById.get(n.id);
              if (!c) return null;
              const color = tierColor(db, c.tier);
              const onPathNode = pathNodes?.has(n.id);
              return (
                <div
                  key={n.id}
                  className="absolute flex cursor-grab select-none flex-col items-center active:cursor-grabbing"
                  style={{ left: n.x - R, top: n.y - R, width: R * 2, opacity: nodeDim(n.id) ? 0.22 : 1, transition: "opacity 120ms" }}
                  onPointerDown={(e) => onNodePointerDown(e, n.id)}
                  onPointerMove={onNodePointerMove}
                  onPointerUp={() => onNodePointerUp(n.id)}
                  onPointerEnter={() => setHover(n.id)}
                  onPointerLeave={() => setHover((h) => (h === n.id ? null : h))}
                >
                  <div
                    className="grid place-items-center rounded-full text-[13px] text-white shadow-sm"
                    style={{
                      width: R * 2, height: R * 2, background: color, ...serif,
                      border: onPathNode ? "2px solid #A51C30" : "2px solid #fff",
                    }}
                  >
                    {c.avatarImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.avatarImg} alt="" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      (c.name.trim()[0] || "?").toUpperCase()
                    )}
                  </div>
                  <span className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 max-w-[120px] truncate whitespace-nowrap text-center text-[10px] text-stone-600">
                    {c.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
