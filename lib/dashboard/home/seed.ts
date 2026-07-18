import { format } from "date-fns";
import type { HomeState, HomeIntention, HomeQuote } from "./types";

const MAX_INTENTIONS = 200;

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}

/** Local calendar-day key, e.g. "2026-07-17". */
export function todayKey(now: Date): string {
  return format(now, "yyyy-MM-dd");
}

export function emptyHome(): HomeState {
  return { version: 1, dailyIntentions: [], quotes: [], settings: { showQuotes: true } };
}

function normIntention(raw: unknown): HomeIntention | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  if (typeof d.id !== "string" || typeof d.text !== "string" || typeof d.date !== "string") return null;
  return { id: d.id, text: d.text, done: d.done === true, date: d.date };
}

function normQuote(raw: unknown): HomeQuote | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  if (typeof d.text !== "string" || !d.text.trim()) return null;
  return { text: d.text, author: typeof d.author === "string" ? d.author : undefined };
}

/** Coerce a raw app_state doc into a valid HomeState; bound intentions to the newest 200. */
export function normalizeHome(raw: unknown): HomeState {
  const d = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const s = (d.settings && typeof d.settings === "object" ? d.settings : {}) as Record<string, unknown>;
  const intentions = Array.isArray(d.dailyIntentions)
    ? d.dailyIntentions.map(normIntention).filter((x): x is HomeIntention => !!x)
    : [];
  intentions.sort((a, b) => b.date.localeCompare(a.date)); // stable → same-day insertion order preserved
  return {
    version: typeof d.version === "number" ? d.version : 1,
    dailyIntentions: intentions.slice(0, MAX_INTENTIONS),
    quotes: Array.isArray(d.quotes) ? d.quotes.map(normQuote).filter((x): x is HomeQuote => !!x) : [],
    settings: {
      showQuotes: s.showQuotes !== false,
      greetingName: typeof s.greetingName === "string" ? s.greetingName : undefined,
    },
  };
}
