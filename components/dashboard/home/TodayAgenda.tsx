"use client";
import { useEffect, useState } from "react";
import { Card, MonoLabel } from "@/components/dashboard/ui";
import type { ViewKey } from "@/components/dashboard/ui";
import { mono, btnGhost } from "./styles";

interface Ev {
  summary: string;
  start?: string;
  end?: string;
}

/** Today's Google Calendar agenda. Fails closed to a connect CTA when Google isn't linked. */
export function TodayAgenda({ now, onNavigate }: { now: Date; onNavigate: (v: ViewKey) => void }) {
  const [s, setS] = useState<{ loading: boolean; connected: boolean; events: Ev[] }>({
    loading: true,
    connected: false,
    events: [],
  });
  useEffect(() => {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
    fetch(`/api/calendar/events?timeMin=${start}&timeMax=${end}`)
      .then((r) => r.json())
      .then((j) => setS({ loading: false, connected: !!j.connected, events: Array.isArray(j.events) ? j.events : [] }))
      .catch(() => setS({ loading: false, connected: false, events: [] }));
  }, [now]);

  const allDay = s.events.filter((e) => e.start && !e.start.includes("T"));
  const timed = s.events
    .filter((e) => e.start && e.start.includes("T"))
    .sort((a, b) => (a.start! < b.start! ? -1 : 1));
  const fmt = (iso?: string) =>
    iso ? new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }) : "";

  return (
    <Card className="h-full p-5">
      <div className="mb-3 flex items-center justify-between">
        <MonoLabel>Today&apos;s agenda</MonoLabel>
      </div>
      {s.loading ? (
        <p className="text-[12px] text-stone-400">Loading…</p>
      ) : !s.connected ? (
        <div>
          <p className="text-[13px] text-stone-500">Connect Google to see your day.</p>
          <button type="button" onClick={() => onNavigate("people")} className={`mt-2.5 ${btnGhost}`} style={mono}>
            Connect in People → Settings
          </button>
        </div>
      ) : s.events.length === 0 ? (
        <p className="text-[13px] text-stone-400">Nothing scheduled today — a clear canvas.</p>
      ) : (
        <div className="max-h-[280px] space-y-1.5 overflow-y-auto">
          {allDay.map((e, i) => (
            <div key={`a${i}`} className="flex items-center gap-3 border-l-2 border-stone-200 py-1 pl-3">
              <span className="w-[62px] shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-stone-400" style={mono}>
                All day
              </span>
              <span className="truncate text-[13px] text-stone-700">{e.summary}</span>
            </div>
          ))}
          {timed.map((e, i) => (
            <div key={`t${i}`} className="flex items-center gap-3 border-l-2 border-[#A51C30]/30 py-1 pl-3">
              <span className="w-[62px] shrink-0 font-mono text-[10px] tabular-nums text-stone-500" style={mono}>
                {fmt(e.start)}
              </span>
              <span className="truncate text-[13px] text-stone-700">{e.summary}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
