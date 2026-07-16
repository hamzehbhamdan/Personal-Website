"use client";
import { useState, useCallback, useEffect } from "react";
import { Toaster } from "sonner";
import { Menu } from "lucide-react";
import { Rail, type ViewKey } from "./ui";
import { HomeView } from "./HomeView";
import { PeopleView } from "@/components/dashboard/people/PeopleView";
import { CommandPalette } from "./CommandPalette";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { signout } from "@/app/dashboard/actions"; // A0: server action — HttpOnly cookies can't be cleared from JS
import { cn } from "@/lib/utils";

const MONO = { fontFamily: "var(--font-geist-mono), monospace" };

// Task 14: the mobile Sheet reuses the same views as the desktop Rail.
const MOBILE_NAV: { key: ViewKey; label: string }[] = [
  { key: "home", label: "Home" },
  { key: "people", label: "People" },
  { key: "coach", label: "Coach" },
  { key: "brain", label: "Brain" },
];

function Placeholder({ name }: { name: string }) {
  return <div className="p-8 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-400">{name} — coming in the next milestone</div>;
}

export function DashboardShell() {
  const [view, setView] = useState<ViewKey>("home");
  const [cmdOpen, setCmdOpen] = useState(false);
  // Task 14: controls the mobile (`< md`) navigation Sheet.
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  // Sign-out runs server-side (HttpOnly cookie can't be cleared from JS) — invoke the
  // `signout` server action (app/dashboard/actions.ts: createServerSupabase().auth.signOut() → redirect("/login")).
  const signOut = useCallback(() => { void signout(); }, []);

  // A1 review fix: wire the physical ⌘K / Ctrl+K shortcut to open the command palette
  // (previously only the Rail's "⌘K Command" button opened it).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-screen w-full bg-[#f9f8f6]">
      {/* Desktop rail (md+). Below md it collapses into the mobile top bar + Sheet. */}
      <div className="hidden md:flex">
        <Rail active={view} onSelect={setView} onCommand={() => setCmdOpen(true)} onSignOut={signOut} />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar (< md): wordmark + menu button opening the nav Sheet. */}
        <div className="md:hidden flex items-center justify-between border-b border-stone-200 px-4 py-3">
          <span className="font-mono text-[13px] font-medium tracking-[0.14em] text-stone-900" style={MONO}>HH<span className="text-[#A51C30]">.</span></span>
          <button onClick={() => setMobileNavOpen(true)} aria-label="Open menu" className="text-stone-900">
            <Menu className="size-5" />
          </button>
        </div>
        <main className="flex-1 overflow-auto">
          {view === "home" && <HomeView onNavigate={setView} />}
          {view === "people" && <PeopleView />}
          {view === "coach" && <Placeholder name="Coach" />}
          {view === "brain" && <Placeholder name="Brain" />}
        </main>
      </div>

      {/* Mobile navigation Sheet (< md): mirrors the Rail nav + command + sign out. */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[220px] bg-rail p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <nav className="flex flex-col pt-14">
            {MOBILE_NAV.map((it) => {
              const on = it.key === view;
              return (
                <button
                  key={it.key}
                  onClick={() => { setView(it.key); setMobileNavOpen(false); }}
                  className={cn(
                    "text-left px-5 py-3 border-l-2 font-mono text-[11px] uppercase tracking-[0.16em]",
                    on ? "border-[#A51C30] bg-white text-[#A51C30] font-medium" : "border-transparent text-stone-400"
                  )}
                  style={MONO}
                >
                  {it.label}
                </button>
              );
            })}
            <div className="mt-4 mx-5 pt-4 border-t border-[#f0eeea] flex flex-col gap-3">
              <button onClick={() => { setMobileNavOpen(false); setCmdOpen(true); }} className="text-left font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400" style={MONO}>⌘K Command</button>
              <button onClick={() => { signOut(); }} className="text-left font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400" style={MONO}>Sign out</button>
            </div>
          </nav>
        </SheetContent>
      </Sheet>

      <Toaster position="bottom-right" />
      <CommandPalette
        isOpen={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onAction={(id) => {
          if (typeof id === "string" && id.startsWith("nav-")) setView(id.slice(4) as ViewKey);
          setCmdOpen(false);
        }}
      />
    </div>
  );
}
