"use client";
import { useState, useCallback, useEffect, useMemo } from "react";
import { Toaster, toast } from "sonner";
import { Menu } from "lucide-react";
import { Rail, type ViewKey } from "./ui";
import { HomeView } from "./HomeView";
import { PeopleView } from "@/components/dashboard/people/PeopleView";
import { CoachView } from "@/components/dashboard/coach/CoachView";
import { CommandPalette } from "./CommandPalette";
import { BrainProvider, useBrain, type BrainIntent } from "@/components/dashboard/brain/BrainProvider";
import { BrainView } from "@/components/dashboard/brain/BrainView";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { signout } from "@/app/dashboard/actions"; // A0: server action — HttpOnly cookies can't be cleared from JS
import { cn } from "@/lib/utils";
import { COMMANDS, type CommandCtx } from "@/lib/dashboard/commands";
import type { ViewIntent } from "@/lib/dashboard/nav";

const MONO = { fontFamily: "var(--font-geist-mono), monospace" };

const MOBILE_NAV: { key: ViewKey; label: string }[] = [
  { key: "home", label: "Home" },
  { key: "people", label: "People" },
  { key: "coach", label: "Coach" },
  { key: "brain", label: "Brain" },
];

function toBrainIntent(intent: Extract<ViewIntent, { view: "brain" }>): BrainIntent {
  if (intent.kind === "note") return { tab: "notes", noteId: intent.id };
  if (intent.kind === "compose") return { tab: "notes", compose: true, draft: intent.draft };
  return { tab: "chat", draft: intent.draft };
}

/** The shell owns Brain state at the top so Home + ⌘K can capture into the same instance. */
export function DashboardShell() {
  return (
    <BrainProvider>
      <DashboardInner />
    </BrainProvider>
  );
}

function DashboardInner() {
  const [view, setView] = useState<ViewKey>("home");
  const [cmdOpen, setCmdOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  // Deep-link target for People/Coach (Brain deep-links go through the provider).
  const [pendingIntent, setPendingIntent] = useState<ViewIntent | null>(null);
  const brain = useBrain();
  const signOut = useCallback(() => { void signout(); }, []);

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

  const ctx = useMemo<CommandCtx>(
    () => ({
      setView,
      select: (intent) => {
        if (intent.view === "brain") {
          brain.requestOpen(toBrainIntent(intent));
          setView("brain");
        } else {
          setPendingIntent(intent);
          setView(intent.view);
        }
      },
      capture: (draft) => {
        if (draft && draft.trim()) {
          brain.addCapture(draft);
          toast.success("Captured to Brain");
        } else {
          brain.requestOpen({ tab: "capture" });
          setView("brain");
        }
      },
      ask: (draft) => {
        brain.requestOpen({ tab: "chat", draft });
        setView("brain");
      },
      openGoogle: (q) => {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(q)}`, "_blank", "noopener,noreferrer");
      },
      close: () => setCmdOpen(false),
    }),
    [brain],
  );

  return (
    <div className="flex h-screen w-full bg-[#f9f8f6]">
      {/* Desktop rail (md+). Below md it collapses into the mobile top bar + Sheet. */}
      <div className="hidden md:flex">
        <Rail active={view} onSelect={setView} onCommand={() => setCmdOpen(true)} onSignOut={signOut} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar (< md): wordmark + menu button opening the nav Sheet. */}
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3 md:hidden">
          <span className="font-mono text-[13px] font-medium tracking-[0.14em] text-stone-900" style={MONO}>
            HH<span className="text-[#A51C30]">.</span>
          </span>
          <button onClick={() => setMobileNavOpen(true)} aria-label="Open menu" className="text-stone-900">
            <Menu className="size-5" />
          </button>
        </div>
        <main className="flex-1 overflow-auto">
          {view === "home" && <HomeView onNavigate={setView} />}
          {view === "people" && (
            <PeopleView
              initialSelect={pendingIntent?.view === "people" ? pendingIntent : null}
              onConsumed={() => setPendingIntent(null)}
            />
          )}
          {view === "coach" && (
            <CoachView
              initialSelect={pendingIntent?.view === "coach" ? pendingIntent : null}
              onConsumed={() => setPendingIntent(null)}
            />
          )}
          {view === "brain" && <BrainView />}
        </main>
      </div>

      {/* Mobile navigation Sheet (< md): mirrors the Rail nav + command + sign out. */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[220px] bg-rail p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SheetDescription className="sr-only">Site navigation menu</SheetDescription>
          <nav className="flex flex-col pt-14">
            {MOBILE_NAV.map((it) => {
              const on = it.key === view;
              return (
                <button
                  key={it.key}
                  onClick={() => {
                    setView(it.key);
                    setMobileNavOpen(false);
                  }}
                  className={cn(
                    "border-l-2 px-5 py-3 text-left font-mono text-[11px] uppercase tracking-[0.16em]",
                    on ? "border-[#A51C30] bg-white font-medium text-[#A51C30]" : "border-transparent text-stone-400",
                  )}
                  style={MONO}
                >
                  {it.label}
                </button>
              );
            })}
            <div className="mx-5 mt-4 flex flex-col gap-3 border-t border-[#f0eeea] pt-4">
              <button onClick={() => { setMobileNavOpen(false); setCmdOpen(true); }} className="text-left font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400" style={MONO}>
                ⌘K Command
              </button>
              <button onClick={() => { signOut(); }} className="text-left font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400" style={MONO}>
                Sign out
              </button>
            </div>
          </nav>
        </SheetContent>
      </Sheet>

      <Toaster position="bottom-right" />
      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} commands={COMMANDS} ctx={ctx} />
    </div>
  );
}
