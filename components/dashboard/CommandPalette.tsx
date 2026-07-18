"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Command as CommandIcon, ArrowRight, Users, Target, BookOpen, Sparkles, Loader2, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { filterCommands, type Command, type CommandCtx } from "@/lib/dashboard/commands";
import type { ViewIntent } from "@/lib/dashboard/nav";

interface SearchResult {
  type: "contact" | "goal" | "task" | "note";
  id: string;
  title: string;
  subtitle?: string;
  view: "people" | "coach" | "brain";
}

type Item =
  | { kind: "google"; q: string }
  | { kind: "ask"; q: string }
  | { kind: "command"; cmd: Command }
  | { kind: "result"; res: SearchResult }
  | { kind: "recent"; res: SearchResult };

const mono = { fontFamily: "var(--font-geist-mono), monospace" };

const typeLabel = (t: SearchResult["type"]) =>
  t === "contact" ? "Contact" : t === "goal" ? "Goal" : t === "task" ? "Task" : "Note";
const iconForType = (t: SearchResult["type"]): LucideIcon =>
  t === "contact" ? Users : t === "note" ? BookOpen : Target;

function resultToIntent(r: SearchResult): ViewIntent {
  if (r.type === "contact") return { view: "people", kind: "contact", id: r.id };
  if (r.type === "goal") return { view: "coach", kind: "goal", id: r.id };
  if (r.type === "task") return { view: "coach", kind: "task", id: r.id };
  return { view: "brain", kind: "note", id: r.id };
}

function itemView(item: Item): { icon: LucideIcon; label: string; sub: string } {
  switch (item.kind) {
    case "google":
      return { icon: Search, label: `Search Google: “${item.q}”`, sub: "External" };
    case "ask":
      return { icon: Sparkles, label: `Ask AI: “${item.q}”`, sub: "AI" };
    case "command":
      return { icon: item.cmd.icon, label: item.cmd.label, sub: item.cmd.category };
    case "result":
    case "recent":
      return { icon: iconForType(item.res.type), label: item.res.title, sub: item.res.subtitle ?? typeLabel(item.res.type) };
  }
}

export function CommandPalette({
  isOpen,
  onClose,
  commands,
  ctx,
}: {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
  ctx: CommandCtx;
}) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recents, setRecents] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Recents are in-memory only (per session) — never persisted, so contact names /
  // note first-lines don't linger in localStorage across sign-out.
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Authenticated, debounced search (abort in-flight on each keystroke → no out-of-order clobber).
  useEffect(() => {
    const qq = query.trim().toLowerCase();
    if (qq.length < 2 || qq.startsWith("g:") || qq.startsWith("search:")) {
      setResults([]);
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : { results: [] }))
        .then((j) => {
          setResults(Array.isArray(j.results) ? j.results : []);
          setLoading(false);
        })
        .catch((e: unknown) => {
          if (!(e instanceof DOMException && e.name === "AbortError")) setLoading(false);
        });
    }, 220);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  const items = useMemo<Item[]>(() => {
    const qq = query.trim();
    if (!qq) {
      return [
        ...recents.map((res): Item => ({ kind: "recent", res })),
        ...commands.map((cmd): Item => ({ kind: "command", cmd })),
      ];
    }
    const lower = qq.toLowerCase();
    const isG = lower.startsWith("g:") || lower.startsWith("search:");
    const arr: Item[] = [];
    if (isG) {
      const term = qq.slice(qq.indexOf(":") + 1).trim();
      if (term) arr.push({ kind: "google", q: term });
    }
    arr.push(...filterCommands(commands, qq).map((cmd): Item => ({ kind: "command", cmd })));
    arr.push(...results.map((res): Item => ({ kind: "result", res })));
    if (!isG && qq.length >= 3) arr.push({ kind: "ask", q: qq });
    return arr;
  }, [query, recents, commands, results]);

  useEffect(() => {
    setSelectedIndex((i) => (i >= items.length ? 0 : i));
  }, [items.length]);

  const addRecent = (res: SearchResult) => {
    setRecents((prev) => [res, ...prev.filter((r) => !(r.id === res.id && r.type === res.type))].slice(0, 6));
  };

  const run = (item: Item) => {
    if (item.kind === "command") item.cmd.run(ctx);
    else if (item.kind === "google") ctx.openGoogle(item.q);
    else if (item.kind === "ask") ctx.ask(item.q);
    else {
      addRecent(item.res);
      ctx.select(resultToIntent(item.res));
    }
    onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((p) => (p + 1) % (items.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((p) => (p - 1 + (items.length || 1)) % (items.length || 1));
      } else if (e.key === "Enter") {
        const item = items[selectedIndex];
        if (item) run(item);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, items, selectedIndex, ctx, onClose]);

  useEffect(() => {
    scrollRef.current?.querySelector(`[data-i="${selectedIndex}"]`)?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center px-4 pt-[15vh]" role="dialog" aria-modal="true">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[rgba(40,35,22,0.45)]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -14 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-[14px] border border-stone-200 bg-white shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-stone-200 px-5 py-4">
              <Search className="text-stone-300" size={18} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                placeholder="Search people, goals, notes — or run a command…"
                className="flex-1 bg-transparent text-[16px] font-medium text-stone-900 outline-none placeholder:text-stone-300"
              />
              {loading && <Loader2 className="animate-spin text-[#A51C30]" size={15} />}
              <div className="flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-1.5 py-0.5">
                <CommandIcon size={11} className="text-stone-400" />
                <span className="font-mono text-[10px] font-medium text-stone-400" style={mono}>K</span>
              </div>
            </div>

            <div ref={scrollRef} className="max-h-[440px] overflow-y-auto p-2">
              {items.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-400" style={mono}>
                    {loading ? "Searching…" : "No results"}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {items.map((item, i) => {
                    const v = itemView(item);
                    const Icon = v.icon;
                    const on = i === selectedIndex;
                    return (
                      <button
                        key={`${item.kind}-${i}`}
                        data-i={i}
                        onClick={() => run(item)}
                        onMouseEnter={() => setSelectedIndex(i)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-lg px-3.5 py-2.5 text-left transition-colors",
                          on ? "bg-[#A51C30] text-white" : "text-stone-600 hover:bg-stone-50",
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className={cn("grid size-8 shrink-0 place-items-center rounded-lg", on ? "bg-white/15" : "bg-stone-100")}>
                            <Icon size={15} />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-[13px] font-medium">{v.label}</div>
                            <div className={cn("font-mono text-[9px] uppercase tracking-[0.16em]", on ? "text-white/60" : "text-stone-400")} style={mono}>
                              {v.sub}
                            </div>
                          </div>
                        </div>
                        {on && <ArrowRight size={15} className="shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-stone-200 bg-stone-50 px-4 py-2.5">
              <div className="flex gap-4">
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-stone-400" style={mono}>↑↓ navigate</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-stone-400" style={mono}>↵ open</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-stone-400" style={mono}>g: google</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
