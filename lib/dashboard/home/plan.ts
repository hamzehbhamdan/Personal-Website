// Open-time engine for "Plan my day": subtract today's timed busy intervals from
// the remaining working-day window and return the free gaps.
export interface OpenBlock {
  start: Date;
  end: Date;
  mins: number;
}

interface RawEvent {
  start?: string;
  end?: string;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

/**
 * @param events  today's calendar events ({start,end} ISO). All-day (date-only, no "T") are ignored.
 * @param now     current time
 * @param opts    dayEndHour (default 21:00 local), minMins (default 30) — smaller gaps are dropped
 */
export function computeOpenBlocks(
  events: RawEvent[],
  now: Date,
  opts?: { dayEndHour?: number; minMins?: number },
): OpenBlock[] {
  const dayEndHour = opts?.dayEndHour ?? 21;
  const minMins = opts?.minMins ?? 30;
  const windowStart = new Date(Math.max(now.getTime(), startOfDay(now).getTime()));
  const windowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), dayEndHour, 0, 0, 0);
  if (windowEnd.getTime() <= windowStart.getTime()) return [];

  const busy = events
    .filter((e) => !!e.start && !!e.end && e.start.includes("T")) // timed events only
    .map((e) => ({ s: new Date(e.start as string), en: new Date(e.end as string) }))
    .filter((e) => !isNaN(e.s.getTime()) && !isNaN(e.en.getTime()) && e.en > windowStart && e.s < windowEnd)
    .map((e) => ({
      s: new Date(Math.max(e.s.getTime(), windowStart.getTime())),
      en: new Date(Math.min(e.en.getTime(), windowEnd.getTime())),
    }))
    .sort((a, b) => a.s.getTime() - b.s.getTime());

  // merge overlaps
  const merged: { s: Date; en: Date }[] = [];
  for (const b of busy) {
    const last = merged[merged.length - 1];
    if (last && b.s.getTime() <= last.en.getTime()) {
      if (b.en.getTime() > last.en.getTime()) last.en = b.en;
    } else {
      merged.push({ s: b.s, en: b.en });
    }
  }

  // subtract busy from [windowStart, windowEnd]
  const gaps: OpenBlock[] = [];
  let cursor = windowStart;
  for (const b of merged) {
    if (b.s.getTime() > cursor.getTime()) {
      const mins = Math.round((b.s.getTime() - cursor.getTime()) / 60_000);
      if (mins >= minMins) gaps.push({ start: cursor, end: b.s, mins });
    }
    if (b.en.getTime() > cursor.getTime()) cursor = b.en;
  }
  if (windowEnd.getTime() > cursor.getTime()) {
    const mins = Math.round((windowEnd.getTime() - cursor.getTime()) / 60_000);
    if (mins >= minMins) gaps.push({ start: cursor, end: windowEnd, mins });
  }
  return gaps;
}

export function fmtBlock(b: OpenBlock): string {
  const f = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const h = Math.floor(b.mins / 60);
  const m = b.mins % 60;
  const dur = h ? `${h}h${m ? ` ${m}m` : ""}` : `${m}m`;
  return `${f(b.start)} – ${f(b.end)} · ${dur}`;
}
