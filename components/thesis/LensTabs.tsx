"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LENSES } from "@/lib/thesis-content";
import { BlockTeX } from "./Math";

export function LensTabs() {
  const [active, setActive] = useState(LENSES[0].id);
  const activeLens = LENSES.find((l) => l.id === active) ?? LENSES[0];

  return (
    <div className="mt-6">
      {/* Tab buttons */}
      <div className="flex gap-2 border-b border-stone-200 pb-0">
        {LENSES.map((lens) => (
          <button
            key={lens.id}
            onClick={() => setActive(lens.id)}
            className={`relative px-4 py-2.5 text-sm transition-colors ${
              active === lens.id
                ? "text-stone-900"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            <span className="mr-1.5 font-mono text-[10px] text-stone-300">
              {lens.number}
            </span>
            {lens.shortTitle}
            {active === lens.id && (
              <motion.div
                layoutId="lens-underline"
                className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#A51C30]"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Content panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeLens.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="mt-6 grid gap-6 md:grid-cols-5"
        >
          {/* Left: description + equations (3 cols) */}
          <div className="md:col-span-3 space-y-4">
            <div>
              <h3 className="mb-2 text-lg font-semibold text-stone-800">{activeLens.title}</h3>
              <p className="text-sm leading-relaxed text-stone-600">{activeLens.description}</p>
            </div>

            {/* LaTeX equations */}
            <div className="rounded-sm border border-stone-200 bg-stone-50 overflow-hidden">
              <div className="border-b border-stone-100 px-4 py-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400">
                  Core Formulation
                </span>
              </div>
              <div className="divide-y divide-stone-100">
                {activeLens.mathLines.map((line, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-2">
                    {/* Label */}
                    <span className="mt-0.5 w-24 shrink-0 font-mono text-[9px] uppercase tracking-wider text-stone-400">
                      {line.label}
                    </span>
                    {/* Equation + optional note */}
                    <div className="min-w-0 flex-1">
                      <div className="overflow-x-auto">
                        <BlockTeX className="text-sm [&_.katex]:text-stone-800">
                          {line.latex}
                        </BlockTeX>
                      </div>
                      {line.note && (
                        <p className="mt-1 text-center text-[11px] leading-snug text-stone-400">{line.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: what this lens reveals + model count (2 cols) */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <div className="rounded-sm border border-[#A51C30]/12 bg-[#A51C30]/5 p-4">
              <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[#A51C30]">
                What this lens reveals
              </div>
              <p className="text-sm leading-relaxed text-[#7a0e1e]">{activeLens.reveals}</p>
            </div>

            {activeLens.modelCount && (
              <div className="rounded-sm border border-stone-200 bg-white/70 px-4 py-3">
                <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400">
                  Model count
                </div>
                <p className="font-mono text-[10px] text-stone-600">{activeLens.modelCount}</p>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
