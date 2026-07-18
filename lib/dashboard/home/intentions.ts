import type { HomeState, HomeIntention } from "./types";
import { uid } from "./seed";

/** Intentions belonging to the given day key (daily reset falls out of the date filter). */
export function todaysIntentions(s: HomeState, key: string): HomeIntention[] {
  return s.dailyIntentions.filter((i) => i.date === key);
}

export function addIntention(s: HomeState, text: string, key: string): HomeState {
  const t = text.trim();
  if (!t) return s;
  return { ...s, dailyIntentions: [{ id: uid(), text: t, done: false, date: key }, ...s.dailyIntentions] };
}

export function toggleIntention(s: HomeState, id: string): HomeState {
  return { ...s, dailyIntentions: s.dailyIntentions.map((i) => (i.id === id ? { ...i, done: !i.done } : i)) };
}

export function removeIntention(s: HomeState, id: string): HomeState {
  return { ...s, dailyIntentions: s.dailyIntentions.filter((i) => i.id !== id) };
}
