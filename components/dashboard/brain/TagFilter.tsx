"use client";
import { mono } from "./styles";

/** Chip bar of all note tags; controlled multi-select filter. */
export function TagFilter({
  allTags,
  selected,
  onToggle,
  onClear,
}: {
  allTags: string[];
  selected: string[];
  onToggle: (t: string) => void;
  onClear: () => void;
}) {
  if (allTags.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {allTags.map((t) => {
        const on = selected.includes(t);
        return (
          <button
            key={t}
            type="button"
            onClick={() => onToggle(t)}
            className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors ${
              on ? "bg-[#A51C30] text-white" : "bg-[#f0eeea] text-stone-500 hover:text-stone-700"
            }`}
            style={mono}
          >
            {t}
          </button>
        );
      })}
      {selected.length > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="font-mono text-[10px] uppercase tracking-[0.1em] text-stone-400 hover:text-[#A51C30]"
          style={mono}
        >
          clear
        </button>
      )}
    </div>
  );
}
