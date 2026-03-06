"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { THEMES } from "@/lib/thesis-content";

const minCount = Math.min(...THEMES.map((t) => t.factorCount));
const maxCount = Math.max(...THEMES.map((t) => t.factorCount));

function getColSpan(count: number) {
  // Maps [minCount, maxCount] → [1, 4] column spans
  return Math.max(1, Math.round(1 + ((count - minCount) / (maxCount - minCount)) * 3));
}

export function ThemesGrid() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">
          The 13 Thematic Clusters
        </p>
        <p className="text-[11px] font-medium text-[#A51C30]">Cell size reflects factor count · click for definition</p>
      </div>
      <div className="grid grid-cols-10 gap-1.5">
        {THEMES.map((theme) => {
          const colSpan = getColSpan(theme.factorCount);
          const isOpen = selected === theme.name;

          return (
            <div
              key={theme.name}
              style={{ gridColumn: `span ${colSpan}` }}
              className="relative"
            >
              <button
                onClick={() => setSelected(isOpen ? null : theme.name)}
                className={`w-full h-[62px] flex flex-col justify-start rounded-sm border text-left px-3 py-2.5 transition-colors overflow-hidden ${
                  isOpen
                    ? "border-stone-300 bg-stone-100"
                    : "border-stone-200 bg-white/80 hover:bg-stone-50 hover:border-stone-300"
                }`}
              >
                <p className="text-xs font-semibold leading-tight text-stone-800">
                  {theme.name}
                </p>
                <p className="mt-0.5 font-mono text-[8px] text-stone-400">
                  {theme.factorCount} Factors
                </p>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 z-50 mt-1 w-56 rounded-sm border border-stone-200 bg-white p-3 shadow-md"
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <p className="text-[11px] font-semibold text-stone-800">{theme.name}</p>
                      <span className="font-mono text-[9px] text-stone-400">{theme.factorCount} factors</span>
                    </div>
                    <p className="text-[10px] leading-relaxed text-stone-500">{theme.description}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
