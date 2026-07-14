"use client";
import { cn } from "@/lib/utils";
export type ViewKey = "home" | "people" | "coach" | "brain";
const ITEMS: { key: ViewKey; n: string; label: string }[] = [
  { key: "home", n: "01", label: "Home" }, { key: "people", n: "02", label: "People" },
  { key: "coach", n: "03", label: "Coach" }, { key: "brain", n: "04", label: "Brain" },
];
export function Rail({ active, onSelect, onCommand, onSignOut }:
  { active: ViewKey; onSelect: (v: ViewKey) => void; onCommand: () => void; onSignOut: () => void }) {
  const mono = { fontFamily: "var(--font-geist-mono), monospace" };
  return (
    <nav className="w-[158px] shrink-0 border-r border-stone-200 bg-rail py-[22px] flex flex-col">
      <div className="px-[18px] pb-[22px]">
        <span className="font-mono text-[13px] font-medium tracking-[0.14em] text-stone-900" style={mono}>HH<span className="text-[#A51C30]">.</span></span>
      </div>
      {ITEMS.map((it) => {
        const on = it.key === active;
        return (
          <button key={it.key} onClick={() => onSelect(it.key)}
            className={cn("flex gap-2 px-[18px] py-[9px] border-l-2 text-left", on ? "border-[#A51C30] bg-white" : "border-transparent")}>
            <span className="font-mono text-[11px]" style={mono} >{/* number */}<span className={on ? "text-[#A51C30]" : "text-stone-300"}>{it.n}</span></span>
            <span className={cn("font-mono text-[11px] uppercase tracking-[0.16em]", on ? "text-stone-900 font-medium" : "text-stone-400")} style={mono}>{it.label}</span>
          </button>
        );
      })}
      <div className="mt-auto mx-[18px] pt-4 border-t border-[#f0eeea] flex flex-col gap-3">
        <button onClick={onCommand} className="text-left font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400" style={mono}>⌘K Command</button>
        <button onClick={onSignOut} className="text-left font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400" style={mono}>Sign out</button>
      </div>
    </nav>
  );
}
