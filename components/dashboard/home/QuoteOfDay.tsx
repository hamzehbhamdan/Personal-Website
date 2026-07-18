"use client";
import { Card } from "@/components/dashboard/ui";
import { quoteForDay } from "@/lib/dashboard/home/quotes";
import { serif, mono } from "./styles";
import type { HomeQuote, HomeSettings } from "@/lib/dashboard/home/types";

/** Quote of the day — stable within a calendar day. */
export function QuoteOfDay({ quotes, settings, now }: { quotes: HomeQuote[]; settings: HomeSettings; now: Date | null }) {
  if (!now) return null;
  const q = quoteForDay(quotes, settings, now);
  if (!q) return null;
  return (
    <Card className="flex h-full flex-col justify-center p-5">
      <p className="text-[16px] italic leading-relaxed text-stone-700" style={serif}>
        &ldquo;{q.text}&rdquo;
      </p>
      {q.author && (
        <p className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400" style={mono}>
          — {q.author}
        </p>
      )}
    </Card>
  );
}
