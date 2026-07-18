import type { LucideIcon } from "lucide-react";
import { Home, Users, Target, BookOpen, FilePlus, UserPlus, Sparkles, CalendarClock } from "lucide-react";
import type { ViewIntent, ViewKey } from "./nav";

/** Execution context the palette hands each command. Built in the dashboard shell. */
export interface CommandCtx {
  setView: (v: ViewKey) => void;
  select: (intent: ViewIntent) => void; // deep-link: navigate + open the target entity
  capture: (draft?: string) => void; // add to Brain inbox (with draft) or open the capture tab
  ask: (draft?: string) => void; // open Brain chat (optionally auto-send the draft)
  openGoogle: (q: string) => void;
  close: () => void;
}

export type CommandCategory = "Navigate" | "Create" | "AI" | "App";

export interface Command {
  id: string;
  label: string;
  hint?: string;
  category: CommandCategory;
  icon: LucideIcon;
  keywords?: string[];
  run: (ctx: CommandCtx) => void;
}

export const COMMANDS: Command[] = [
  { id: "nav-home", label: "Go to Home", category: "Navigate", icon: Home, run: (c) => c.setView("home") },
  { id: "nav-people", label: "Go to People", category: "Navigate", icon: Users, run: (c) => c.setView("people") },
  { id: "nav-coach", label: "Go to Coach", category: "Navigate", icon: Target, run: (c) => c.setView("coach") },
  { id: "nav-brain", label: "Go to Brain", category: "Navigate", icon: BookOpen, run: (c) => c.setView("brain") },
  { id: "new-note", label: "New note", category: "Create", icon: FilePlus, keywords: ["brain", "write"], run: (c) => c.select({ view: "brain", kind: "compose" }) },
  { id: "add-contact", label: "Add contact", category: "Create", icon: UserPlus, keywords: ["people", "crm"], run: (c) => c.select({ view: "people", kind: "newContact" }) },
  { id: "plan-day", label: "Plan my day", category: "App", icon: CalendarClock, keywords: ["briefing", "today", "schedule"], run: (c) => c.setView("home") },
  { id: "ask-ai", label: "Ask AI", category: "AI", icon: Sparkles, keywords: ["chat", "brain", "question"], run: (c) => c.ask() },
];

export function filterCommands(cmds: Command[], q: string): Command[] {
  const ql = q.trim().toLowerCase();
  if (!ql) return cmds;
  return cmds.filter(
    (c) =>
      c.label.toLowerCase().includes(ql) ||
      c.category.toLowerCase().includes(ql) ||
      !!c.hint?.toLowerCase().includes(ql) ||
      !!c.keywords?.some((k) => k.includes(ql)),
  );
}
