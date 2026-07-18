"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { mono } from "./styles";

/** Add/remove tags on a note. Enter or comma commits; Backspace on empty removes last. */
export function TagInput({
  tags,
  onChange,
  suggestions = [],
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
}) {
  const [input, setInput] = useState("");
  const add = (raw: string) => {
    const t = raw.trim().toLowerCase().replace(/^#/, "");
    setInput("");
    if (!t || tags.includes(t)) return;
    onChange([...tags, t]);
  };
  const remove = (t: string) => onChange(tags.filter((x) => x !== t));
  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 rounded-[8px] border border-stone-200 px-2 py-1.5">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-full bg-[#f0eeea] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-stone-500"
            style={mono}
          >
            {t}
            <button type="button" onClick={() => remove(t)} aria-label={`Remove ${t}`} className="text-stone-400 hover:text-[#A51C30]">
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(input);
            } else if (e.key === "Backspace" && !input && tags.length) {
              remove(tags[tags.length - 1]);
            }
          }}
          placeholder={tags.length ? "" : "add tags…"}
          className="min-w-[80px] flex-1 bg-transparent text-[13px] text-stone-700 outline-none placeholder:text-stone-300"
        />
      </div>
      {suggestions.filter((s) => !tags.includes(s)).length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {suggestions
            .filter((s) => !tags.includes(s))
            .slice(0, 8)
            .map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => add(s)}
                className="rounded-full border border-dashed border-stone-300 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-stone-400 hover:border-[#A51C30] hover:text-[#A51C30]"
                style={mono}
              >
                + {s}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
