// components/dashboard/people/useLiveInteractions.ts
"use client";
import { useEffect, useState } from "react";
import { buildGmailMap, buildCalMap } from "@/lib/dashboard/people/interactions";
import type { GmailMap, CalMap, GmailHeaderRow, CalendarEvent } from "@/lib/dashboard/people/types";

export interface LiveState { gmail: GmailMap; cal: CalMap; connected: boolean; synced: boolean; syncing: boolean; }

export function useLiveInteractions(now: Date): LiveState {
  const [s, setS] = useState<LiveState>({ gmail: {}, cal: {}, connected: false, synced: false, syncing: true });
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [sent, inbox, calRes] = await Promise.all([
          fetch("/api/gmail/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mailbox: "sent" }) }).then((r) => r.json()).catch(() => ({ connected: false, rows: [] })),
          fetch("/api/gmail/search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mailbox: "inbox" }) }).then((r) => r.json()).catch(() => ({ connected: false, rows: [] })),
          fetch("/api/calendar/events").then((r) => r.json()).catch(() => ({ connected: false, events: [] })),
        ]);
        if (!alive) return;
        const rows: GmailHeaderRow[] = [...(sent.rows ?? []), ...(inbox.rows ?? [])];
        const events: CalendarEvent[] = calRes.events ?? [];
        setS({ gmail: buildGmailMap(rows, now), cal: buildCalMap(events, now), connected: !!(sent.connected || inbox.connected || calRes.connected), synced: true, syncing: false });
      } catch { if (alive) setS((p) => ({ ...p, syncing: false, synced: true })); }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return s;
}
