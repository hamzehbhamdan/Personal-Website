"use client";
import { useEffect, useState } from "react";
import { ViewHeader, SectionHeader } from "./ui";
import type { ViewKey } from "./ui";

const serif = { fontFamily: "var(--font-playfair), Georgia, serif" };

export function HomeView({ onNavigate }: { onNavigate: (v: ViewKey) => void }) {
  const [crm, setCrm] = useState<any>({});
  const [coach, setCoach] = useState<any>({});
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    fetch("/api/state?app=lifeCRM").then((r) => r.json()).then((j) => setCrm(j.data ?? {})).catch(() => {});
    fetch("/api/state?app=execCoach").then((r) => r.json()).then((j) => setCoach(j.data ?? {})).catch(() => {});
  }, []);
  useEffect(() => {
    setNow(new Date());
  }, []);

  const contacts = Array.isArray(crm.contacts) ? crm.contacts.length : 0;
  const goals = Array.isArray(coach.goals) ? coach.goals.length : 0;
  const meta = now ? now.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).toUpperCase() : "";
  const greeting = now ? `Good ${now.getHours() < 12 ? "morning" : now.getHours() < 18 ? "afternoon" : "evening"}, Hamzeh.` : "Hello, Hamzeh.";

  return (
    <div className="mx-auto w-full p-7 md:p-8 max-w-wide">
      <ViewHeader meta={meta} title={greeting} />
      <SectionHeader index="01" label="Momentum" />
      <div className="flex gap-9 mb-8">
        <button onClick={() => onNavigate("people")} className="text-left">
          <div className="text-[28px] leading-none font-medium text-stone-900" style={serif}>{contacts}</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400 mt-1.5" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>Contacts</div>
        </button>
        <button onClick={() => onNavigate("coach")} className="text-left">
          <div className="text-[28px] leading-none font-medium text-stone-900" style={serif}>{goals}</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400 mt-1.5" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>Goals</div>
        </button>
      </div>
      <SectionHeader index="02" label="Today" />
      <p className="text-[13px] text-stone-500">People and Coach light up here once those apps land (B/C).</p>
    </div>
  );
}
