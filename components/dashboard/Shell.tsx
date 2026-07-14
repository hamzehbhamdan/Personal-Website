"use client";
import { useState, useCallback } from "react";
import { Toaster } from "sonner";
import { Rail, type ViewKey } from "./ui";
import { HomeView } from "./HomeView";
import { CommandPalette } from "./CommandPalette";
import { signout } from "@/app/dashboard/actions"; // A0: server action — HttpOnly cookies can't be cleared from JS

function Placeholder({ name }: { name: string }) {
  return <div className="p-8 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-400">{name} — coming in the next milestone</div>;
}

export function DashboardShell() {
  const [view, setView] = useState<ViewKey>("home");
  const [cmdOpen, setCmdOpen] = useState(false);
  // Sign-out runs server-side (HttpOnly cookie can't be cleared from JS) — invoke the
  // `signout` server action (app/dashboard/actions.ts: createServerSupabase().auth.signOut() → redirect("/login")).
  const signOut = useCallback(() => { void signout(); }, []);

  return (
    <div className="flex h-screen w-full bg-[#f9f8f6]">
      <Rail active={view} onSelect={setView} onCommand={() => setCmdOpen(true)} onSignOut={signOut} />
      <main className="flex-1 overflow-auto">
        {view === "home" && <HomeView onNavigate={setView} />}
        {view === "people" && <Placeholder name="People" />}
        {view === "coach" && <Placeholder name="Coach" />}
        {view === "brain" && <Placeholder name="Brain" />}
      </main>
      <Toaster position="bottom-right" />
      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} onAction={() => setCmdOpen(false)} />
    </div>
  );
}
