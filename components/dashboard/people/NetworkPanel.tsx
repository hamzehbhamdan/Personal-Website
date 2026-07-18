"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CrmDB } from "@/lib/dashboard/people/types";
import { step, seedPositions, type SimNode } from "@/lib/dashboard/people/graph-sim";
import { edgeKey, neighbors, removeEdge } from "@/lib/dashboard/people/connections";
import { tierColor } from "@/lib/dashboard/people/tiers";
import { normalizeDb } from "@/lib/dashboard/people/backup";

const mono = { fontFamily: "var(--font-geist-mono), monospace" };
const serif = { fontFamily: "var(--font-playfair), Georgia, serif" };
const W = 920;
const H = 560;
const R = 21; // node radius

function initial(name: string): string {
  return (name.trim()[0] || "?").toUpperCase();
}

export function NetworkPanel({ db, setState, onOpenContact, onOpenLink }: {
  db: CrmDB;
  setState: (fn: (prev: CrmDB) => CrmDB) => void;
  onOpenContact: (id: string) => void;
  onOpenLink: () => void;
}) {
  const contacts = db.contacts;
  const edges = db.connections;
  const nameById = useMemo(() => new Map(contacts.map((c) => [c.id, c.name])), [contacts]);

  const [nodes, setNodes] = useState<SimNode[]>([]);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const [hover, setHover] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; moved: boolean } | null>(null);
  const pan = useRef<{ x: number; y: number } | null>(null);

  // Sync sim nodes with the contact set (keep positions for existing, seed new), then pre-warm.
  useEffect(() => {
    setNodes((prev) => {
      const byId = new Map(prev.map((n) => [n.id, n]));
      const ids = contacts.map((c) => c.id);
      const kept = ids.filter((id) => byId.has(id)).map((id) => byId.get(id)!);
      const seeded = seedPositions(ids.filter((id) => !byId.has(id)), W / 2, H / 2);
      const all = [...kept, ...seeded];
      for (let i = 0; i < 160; i++) step(all, edges, { centerX: W / 2, centerY: H / 2, friction: 0.9 });
      return all;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contacts]);

  // Live relaxation loop.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setNodes((prev) => {
        if (!prev.length) return prev;
        const next = prev.map((n) => ({ ...n }));
        step(next, edges, { centerX: W / 2, centerY: H / 2, friction: 0.92 });
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [edges]);

  const posById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const litSet = useMemo(() => {
    if (!hover) return null;
    return new Set([hover, ...neighbors(edges, hover)]);
  }, [hover, edges]);

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
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, pinned: true } : n)));
  }
  function onNodePointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    drag.current.moved = true;
    const p = toGraph(e.clientX, e.clientY);
    const id = drag.current.id;
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, x: p.x, y: p.y, vx: 0, vy: 0 } : n)));
  }
  function onNodePointerUp(e: React.PointerEvent, id: string) {
    const wasMoved = drag.current?.moved;
    drag.current = null;
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
    const na = nameById.get(a) ?? "someone", nb = nameById.get(b) ?? "someone";
    if (!window.confirm(`Remove the connection between ${na} and ${nb}?`)) return;
    setState((prev) => {
      const d = normalizeDb(prev);
      return { ...d, connections: removeEdge(d.connections, a, b) };
    });
  }

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
                const lit = !litSet || (litSet.has(e.a) && litSet.has(e.b));
                return (
                  <g key={edgeKey(e)}>
                    <line
                      x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                      stroke={lit ? "#d6cfc4" : "#ece8e1"} strokeWidth={1.5}
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
              const c = contacts.find((x) => x.id === n.id);
              if (!c) return null;
              const color = tierColor(db, c.tier);
              const dim = litSet && !litSet.has(n.id);
              return (
                <div
                  key={n.id}
                  className="absolute flex cursor-grab select-none flex-col items-center active:cursor-grabbing"
                  style={{ left: n.x - R, top: n.y - R, opacity: dim ? 0.25 : 1, transition: "opacity 120ms" }}
                  onPointerDown={(e) => onNodePointerDown(e, n.id)}
                  onPointerMove={onNodePointerMove}
                  onPointerUp={(e) => onNodePointerUp(e, n.id)}
                  onPointerEnter={() => setHover(n.id)}
                  onPointerLeave={() => setHover((h) => (h === n.id ? null : h))}
                >
                  <div
                    className="grid place-items-center rounded-full border-2 border-white text-[13px] text-white shadow-sm"
                    style={{ width: R * 2, height: R * 2, background: color, ...serif }}
                  >
                    {c.avatarImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.avatarImg} alt="" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      initial(c.name)
                    )}
                  </div>
                  <span className="mt-1 max-w-[92px] truncate text-center text-[10px] text-stone-600">{c.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
