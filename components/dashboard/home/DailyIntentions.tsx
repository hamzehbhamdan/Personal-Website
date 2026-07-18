"use client";
import { useState } from "react";
import { Plus, Check } from "lucide-react";
import { Card, MonoLabel } from "@/components/dashboard/ui";
import { normalizeHome } from "@/lib/dashboard/home/seed";
import { todaysIntentions, addIntention, toggleIntention, removeIntention } from "@/lib/dashboard/home/intentions";
import type { HomeState } from "@/lib/dashboard/home/types";

/** Checkable "what matters today" list, stored in the home app_state slot; resets daily by date. */
export function DailyIntentions({
  home,
  setHome,
  nowKey,
}: {
  home: HomeState;
  setHome: (updater: (prev: HomeState) => HomeState) => void;
  nowKey: string;
}) {
  const [text, setText] = useState("");
  const items = todaysIntentions(home, nowKey);
  const add = () => {
    if (!text.trim()) return;
    setHome((prev) => addIntention(normalizeHome(prev), text, nowKey));
    setText("");
  };
  return (
    <Card className="h-full p-5">
      <MonoLabel>Intentions for today</MonoLabel>
      <div className="mt-3 space-y-1.5">
        {items.map((i) => (
          <div key={i.id} className="group flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setHome((p) => toggleIntention(normalizeHome(p), i.id))}
              className={`grid size-[18px] shrink-0 place-items-center rounded-[5px] border ${
                i.done ? "border-[#A51C30] bg-[#A51C30] text-white" : "border-stone-300"
              }`}
              aria-label={i.done ? "Mark not done" : "Mark done"}
            >
              {i.done && <Check className="size-3" />}
            </button>
            <span className={`flex-1 text-[13.5px] ${i.done ? "text-stone-400 line-through" : "text-stone-700"}`}>{i.text}</span>
            <button
              type="button"
              onClick={() => setHome((p) => removeIntention(normalizeHome(p), i.id))}
              className="text-lg leading-none text-stone-300 opacity-0 transition-opacity hover:text-[#A51C30] group-hover:opacity-100"
              aria-label="Remove"
            >
              ×
            </button>
          </div>
        ))}
        {items.length === 0 && <p className="text-[13px] text-stone-400">What matters most today?</p>}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add an intention…"
          className="flex-1 border-b border-stone-200 bg-transparent pb-1 text-[13px] text-stone-700 outline-none placeholder:text-stone-300 focus:border-[#A51C30]"
        />
        <button type="button" onClick={add} disabled={!text.trim()} className="text-stone-400 hover:text-[#A51C30] disabled:opacity-30">
          <Plus className="size-4" />
        </button>
      </div>
    </Card>
  );
}
