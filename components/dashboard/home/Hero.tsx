"use client";
import { serif, mono } from "./styles";

/** Cover-page hero: big live clock, full date, time-of-day greeting. */
export function Hero({ now, name = "Hamzeh" }: { now: Date | null; name?: string }) {
  const time = now ? now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }) : "—:—";
  const date = now ? now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "";
  const hour = now ? now.getHours() : 9;
  const part = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400" style={mono}>{date.toUpperCase()}</p>
      <div className="mt-1 text-[56px] font-medium leading-none text-stone-900 tabular-nums sm:text-[64px]" style={serif}>
        {time}
      </div>
      <h1 className="mt-3 text-[24px] font-medium text-stone-900" style={serif}>
        Good {part}, {name}.
      </h1>
    </div>
  );
}
