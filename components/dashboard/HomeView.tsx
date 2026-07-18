"use client";
import { useMemo } from "react";
import { PageContainer, SectionHeader } from "./ui";
import type { ViewKey } from "./ui";
import { useAppState } from "@/lib/dashboard/useAppState";
import { emptyHome, normalizeHome, todayKey } from "@/lib/dashboard/home/seed";
import type { HomeState } from "@/lib/dashboard/home/types";
import { useBrain } from "./brain/BrainProvider";
import { useClock } from "./home/useClock";
import { usePeopleSnapshot } from "./home/usePeopleSnapshot";
import { useCoachSnapshot } from "./home/useCoachSnapshot";
import { Hero } from "./home/Hero";
import { QuoteOfDay } from "./home/QuoteOfDay";
import { KpiStrip } from "./home/KpiStrip";
import { TodayAgenda } from "./home/TodayAgenda";
import { DailyIntentions } from "./home/DailyIntentions";
import { ReachOutToday } from "./home/ReachOutToday";
import { PlanMyDayBriefing } from "./home/PlanMyDayBriefing";
import { QuickCapture } from "./home/QuickCapture";

export function HomeView({ onNavigate }: { onNavigate: (v: ViewKey) => void }) {
  const clock = useClock();
  // Stable "now" for data snapshots so they don't recompute every clock tick.
  const snapNow = useMemo(() => new Date(), []);
  const key = useMemo(() => todayKey(snapNow), [snapNow]);

  const { state: rawHome, setState } = useAppState<HomeState>("home", emptyHome());
  const home = useMemo(() => normalizeHome(rawHome), [rawHome]);
  const people = usePeopleSnapshot(snapNow);
  const coach = useCoachSnapshot(snapNow);
  const brain = useBrain();

  const todaysOpenIntentions = home.dailyIntentions
    .filter((i) => i.date === key && !i.done)
    .map((i) => i.text);

  return (
    <PageContainer width="wide">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-12">
        <section className="min-w-0 md:col-span-2 lg:col-span-8">
          <Hero now={clock} name={home.settings.greetingName} />
        </section>
        <section className="min-w-0 md:col-span-2 lg:col-span-4">
          <QuoteOfDay quotes={home.quotes} settings={home.settings} now={snapNow} />
        </section>

        <div className="md:col-span-2 lg:col-span-12">
          <SectionHeader index="01" label="Momentum" />
        </div>
        <section className="min-w-0 md:col-span-2 lg:col-span-12">
          <KpiStrip people={people} coach={coach} onNavigate={onNavigate} />
        </section>

        <div className="md:col-span-2 lg:col-span-12">
          <SectionHeader index="02" label="Plan my day" />
        </div>
        <section className="min-w-0 md:col-span-2 lg:col-span-7">
          <PlanMyDayBriefing now={snapNow} goals={coach.goals} intentions={todaysOpenIntentions} />
        </section>
        <section className="min-w-0 md:col-span-2 lg:col-span-5">
          <TodayAgenda now={snapNow} onNavigate={onNavigate} />
        </section>

        <div className="md:col-span-2 lg:col-span-12">
          <SectionHeader index="03" label="Today" />
        </div>
        <section className="min-w-0 lg:col-span-4">
          <DailyIntentions home={home} setHome={setState} nowKey={key} />
        </section>
        <section className="min-w-0 lg:col-span-4">
          <ReachOutToday attention={people.attention} connected={people.connected} onNavigate={onNavigate} />
        </section>
        <section className="min-w-0 lg:col-span-4">
          <QuickCapture onCapture={brain.addCapture} />
        </section>
      </div>
    </PageContainer>
  );
}
