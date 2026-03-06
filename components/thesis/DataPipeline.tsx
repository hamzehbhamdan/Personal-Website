"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DATA_PROCESS } from "@/lib/thesis-content";

// ── Icons ────────────────────────────────────────────────────────────────────
const icons: Record<string, React.ReactNode> = {
  clip: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
    </svg>
  ),
  flag: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
    </svg>
  ),
  wave: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
  grid: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  ),
  scale: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
    </svg>
  ),
};

// ── Single collapsible step ───────────────────────────────────────────────────
function StepCard({
  step,
  isLast,
}: {
  step: (typeof DATA_PROCESS.steps)[number];
  isLast: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex gap-4">
      {/* Left: node + connector line */}
      <div className="flex flex-col items-center">
        <button
          onClick={() => setOpen((p) => !p)}
          aria-label={`Toggle ${step.title}`}
          className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
            open
              ? "border-[#A51C30] bg-[#A51C30] text-white shadow-sm"
              : "border-stone-200 bg-white text-stone-500 hover:border-[#A51C30]/50 hover:text-[#A51C30]"
          }`}
        >
          {icons[step.icon]}
        </button>
        {!isLast && (
          <div
            className={`mt-1 w-px flex-1 transition-colors duration-300 ${
              open ? "bg-[#A51C30]/30" : "bg-stone-200"
            }`}
            style={{ minHeight: "1.25rem" }}
          />
        )}
      </div>

      {/* Right: header + collapsible body */}
      <div className="mb-4 min-w-0 flex-1">
        <button
          onClick={() => setOpen((p) => !p)}
          className="flex w-full items-start justify-between gap-3 pb-0 text-left"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] text-stone-300">{step.number}</span>
              <span className="text-sm font-semibold text-stone-800">{step.title}</span>
            </div>
            {!open && step.highlight && (
              <span className="mt-1 inline-block font-mono text-[9px] italic text-stone-400">
                {step.highlight}
              </span>
            )}
          </div>
          <svg
            className={`mt-0.5 h-4 w-4 shrink-0 text-stone-400 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="pt-3 pb-1">
                <p className="text-sm leading-relaxed text-stone-600">{step.body}</p>
                {step.highlight && (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#A51C30]/8 px-2.5 py-1">
                    <span className="h-1 w-1 rounded-full bg-[#A51C30]/60" />
                    <span className="font-mono text-[9px] text-[#A51C30]/80">{step.highlight}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function DataPipeline() {
  return (
    <div>
      <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">
        Steps — click to expand
      </p>
      <div>
        {DATA_PROCESS.steps.map((step, i) => (
          <StepCard
            key={step.id}
            step={step}
            isLast={i === DATA_PROCESS.steps.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
