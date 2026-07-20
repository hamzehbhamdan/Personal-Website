// components/dashboard/people/useLiveInteractions.ts
"use client";
import { useEffect, useMemo, useState } from "react";
import { buildGmailMap, buildCalMap } from "@/lib/dashboard/people/interactions";
import type { GmailMap, CalMap, GmailHeaderRow, CalendarEvent } from "@/lib/dashboard/people/types";

export interface LiveState { gmail: GmailMap; cal: CalMap; connected: boolean; synced: boolean; syncing: boolean; }

interface RawState { rows: GmailHeaderRow[]; events: CalendarEvent[]; connected: boolean; synced: boolean; syncing: boolean; }

/**
 * `saved` (default empty) is the set of lowercased saved-contact addresses, passed through to
 * buildGmailMap/buildCalMap so an address belonging to a saved contact is never dropped by the
 * isPerson spam heuristic (review #66). Raw rows/events are fetched once and the maps are
 * re-derived via useMemo whenever `saved` (or `now`) changes, so late-loading contacts still
 * take effect.
 */
export function useLiveInteractions(now: Date, saved: Set<string> = new Set()): LiveState {
  const [raw, setRaw] = useState<RawState>({ rows: [], events: [], connected: false, synced: false, syncing: true });
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
        setRaw({
          rows: [...(sent.rows ?? []), ...(inbox.rows ?? [])],
          events: calRes.events ?? [],
          connected: !!(sent.connected || inbox.connected || calRes.connected),
          synced: true,
          syncing: false,
        });
      } catch { if (alive) setRaw((p) => ({ ...p, syncing: false, synced: true })); }
    })();
    return () => { alive = false; };
  }, []);
  // Stable key so passing a fresh Set identity each render doesn't thrash the memo below.
  const savedKey = useMemo(() => [...saved].sort().join("\n"), [saved]);
  const gmail = useMemo(() => buildGmailMap(raw.rows, now, saved), [raw.rows, now, savedKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const cal = useMemo(() => buildCalMap(raw.events, now, saved), [raw.events, now, savedKey]); // eslint-disable-line react-hooks/exhaustive-deps
  return { gmail, cal, connected: raw.connected, synced: raw.synced, syncing: raw.syncing };
}
