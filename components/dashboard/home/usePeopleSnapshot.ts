"use client";
import { useEffect, useMemo, useState } from "react";
import { normalizeDb } from "@/lib/dashboard/people/backup";
import { state as computeState } from "@/lib/dashboard/people/state";
import { summaryCounts, attentionList } from "@/lib/dashboard/people/select";
import { useLiveInteractions } from "@/components/dashboard/people/useLiveInteractions";
import type { Contact } from "@/lib/dashboard/people/types";

/** Read-only People (Life CRM) snapshot for Home — reuses the exact People selectors. */
export function usePeopleSnapshot(now: Date) {
  const [raw, setRaw] = useState<unknown>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/state?app=lifeCRM")
      .then((r) => r.json())
      .then((j) => {
        if (alive) setRaw(j.data ?? {});
      })
      .catch(() => {
        if (alive) setRaw({});
      });
    return () => {
      alive = false;
    };
  }, []);
  const db = useMemo(() => normalizeDb(raw ?? {}), [raw]);
  const savedEmails = useMemo(
    () => new Set(db.contacts.flatMap((c) => (c.emails || []).map((e) => e.toLowerCase()))),
    [db],
  );
  const live = useLiveInteractions(now, savedEmails);
  const stateOf = useMemo(
    () => (c: Contact) => computeState(c, live.gmail, live.cal, db, now),
    [live.gmail, live.cal, db, now],
  );
  const counts = useMemo(() => summaryCounts(db, stateOf), [db, stateOf]);
  const attention = useMemo(() => attentionList(db, stateOf, () => false), [db, stateOf]); // Home ignores group-level nudges
  return { db, counts, attention, connected: live.connected, loaded: raw !== null, stateOf };
}

export type PeopleSnapshot = ReturnType<typeof usePeopleSnapshot>;
