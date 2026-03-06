"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MODEL_GRID } from "@/lib/thesis-content";

const qualityConfig: Record<string, { border: string; dot: string; badge: string; label: string; actionBg: string; actionBorder: string }> = {
  good: {
    border: "border-l-emerald-400",
    dot: "bg-emerald-400",
    badge: "bg-emerald-50 text-emerald-700",
    label: "Well-behaved",
    actionBg: "bg-emerald-50/60",
    actionBorder: "border-emerald-100",
  },
  warn: {
    border: "border-l-amber-400",
    dot: "bg-amber-400",
    badge: "bg-amber-50 text-amber-700",
    label: "Correctable",
    actionBg: "bg-amber-50/60",
    actionBorder: "border-amber-100",
  },
  bad: {
    border: "border-l-rose-400",
    dot: "bg-rose-400",
    badge: "bg-rose-50 text-rose-700",
    label: "Structural",
    actionBg: "bg-rose-50/40",
    actionBorder: "border-rose-100",
  },
};

// ── Collapsible residual card ─────────────────────────────────────────────────
function ResidualCard({
  rc,
  i,
}: {
  rc: (typeof MODEL_GRID.residualCases)[number];
  i: number;
}) {
  const [open, setOpen] = useState(false);
  const cfg = qualityConfig[rc.quality];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay: 0.07 * i }}
      className={`rounded-sm border border-l-4 border-stone-200 bg-white/70 overflow-hidden ${cfg.border}`}
    >
      {/* Always-visible header — click to toggle */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={`h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} />
          <span className={`shrink-0 rounded-full px-1.5 py-0.5 font-mono text-[8px] font-medium ${cfg.badge}`}>
            {cfg.label}
          </span>
          <span className="text-[11px] font-semibold text-stone-800 truncate">
            {rc.title.replace(/^Case \d+: /, "")}
          </span>
        </div>
        <svg
          className={`h-3.5 w-3.5 shrink-0 text-stone-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expandable content */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {/* Description */}
            <div className="px-4 pb-4">
              <p className="text-[11px] leading-relaxed text-stone-500">{rc.description}</p>
            </div>
            {/* Response */}
            <div className={`border-t border-dashed px-4 py-3 ${cfg.actionBg} ${cfg.actionBorder}`}>
              <div className="mb-1 flex items-center gap-1">
                <svg className="h-3 w-3 shrink-0 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
                <span className="font-mono text-[8px] uppercase tracking-wider text-stone-400">Response</span>
              </div>
              <p className="text-[11px] leading-relaxed text-stone-600">{rc.action}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function ModelGridDiagram() {
  return (
    <div className="space-y-10">
      {/* Model count summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { value: MODEL_GRID.totalModels.toString(), label: "Total Models", note: "across all specifications" },
          { value: MODEL_GRID.olsModels.toString(), label: "OLS Baseline", note: "unregularized linear" },
          { value: MODEL_GRID.regularizedModels.toString(), label: "Regularized", note: "Ridge / Lasso / Elastic Net" },
        ].map((item) => (
          <div key={item.label} className="rounded-sm border border-stone-200 bg-white/70 p-4 text-center">
            <div className="mb-1 text-2xl font-bold tabular-nums text-stone-800">{item.value}</div>
            <div className="text-xs font-medium text-stone-600">{item.label}</div>
            <div className="mt-0.5 font-mono text-[9px] text-stone-400">{item.note}</div>
          </div>
        ))}
      </div>

      {/* Ridge dominance callout */}
      <div className="rounded-sm border border-[#A51C30]/20 bg-[#A51C30]/5 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[#A51C30]/60" />
          <div>
            <p className="mb-0.5 text-sm font-semibold text-stone-800">Ridge dominated the regularized sweep</p>
            <p className="text-sm leading-relaxed text-stone-600">{MODEL_GRID.regularizationNote}</p>
          </div>
        </div>
      </div>

      {/* Grid dimensions */}
      <div>
        <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">
          Model Specification Grid — 6 Dimensions
        </p>
        <p className="mb-4 text-[11px] leading-relaxed text-stone-500">
          Each row defines one axis along which models were varied. Every combination of these choices was estimated, producing 144+ distinct specifications. The count (×n) shows how many options exist along that axis.
        </p>
        <div className="rounded-sm border border-stone-200 bg-white/70 divide-y divide-stone-100 overflow-hidden">
          {MODEL_GRID.dimensions.map((dim) => (
            <div key={dim.label} className="flex items-start gap-4 px-4 py-3">
              <div className="flex w-32 shrink-0 items-center justify-between">
                <span className="text-[11px] font-semibold text-stone-700">{dim.label}</span>
                <span className="font-mono text-[9px] text-stone-400">×{dim.count}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {dim.options.map((opt) => (
                  <span key={opt} className="rounded-sm border border-stone-200 bg-stone-50 px-2 py-0.5 font-mono text-[9px] text-stone-600">
                    {opt}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cross-validation note */}
      <div className="rounded-sm border border-stone-200 bg-white/60 px-5 py-4">
        <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.15em] text-stone-400">Cross-Validation Strategy</p>
        <p className="text-sm leading-relaxed text-stone-600">{MODEL_GRID.crossValidation}</p>
      </div>

      {/* Residual cases — collapsible */}
      <div>
        <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">
          Residual Plot Diagnostics — 5 Observed Patterns
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 items-start">
          {MODEL_GRID.residualCases.map((rc, i) => (
            <ResidualCard key={rc.id} rc={rc} i={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
