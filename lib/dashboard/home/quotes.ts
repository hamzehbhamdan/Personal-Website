import type { HomeQuote, HomeSettings } from "./types";

/** A small curated seed of short, attributed aphorisms. */
export const DEFAULT_QUOTES: HomeQuote[] = [
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "Well begun is half done.", author: "Aristotle" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Augusta F. Kantra" },
  { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca" },
  { text: "What gets measured gets managed.", author: "Peter Drucker" },
  { text: "You do not rise to the level of your goals; you fall to the level of your systems.", author: "James Clear" },
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "How we spend our days is how we spend our lives.", author: "Annie Dillard" },
  { text: "Make each day your masterpiece.", author: "John Wooden" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "Either you run the day or the day runs you.", author: "Jim Rohn" },
];

/** Deterministic "quote of the day" — stable within a calendar day, cycles by day-of-year. */
export function quoteForDay(quotes: HomeQuote[], settings: HomeSettings, now: Date): HomeQuote | null {
  if (!settings.showQuotes) return null;
  const pool = quotes.length ? quotes : DEFAULT_QUOTES;
  if (!pool.length) return null;
  const yearStart = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - yearStart.getTime()) / 86_400_000);
  return pool[((dayOfYear % pool.length) + pool.length) % pool.length];
}
