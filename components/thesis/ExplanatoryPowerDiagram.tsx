"use client";

import { motion } from "framer-motion";

// Averages across N=20 valid model configurations with all 4 combinations
// (OLS, Ridge/Lasso, SpAM, Kernel — daily & monthly, 2001-24 & 2016-24).
// Overfits excluded: R²=1 or R²=0.9999 with Adj.R²=0 (monthly SpAM/OLS factors).
//   China own-only avg R² = 0.4691  →  China both avg R² = 0.5152  (ΔR² = +4.61 pp)
//   US   own-only avg R² = 0.6937  →  US   both avg R² = 0.7097  (ΔR² = +1.60 pp)
const BARS = [
  {
    label: "U.S. → China",
    sublabel: "Average ΔR² across 20 model configurations",
    baselinePct: 46.91,   // avg R² = 0.4691, China own-country factors
    addedPct: 4.61,       // avg ΔR² = +0.0461 (0.4691 → 0.5152)
    baselineLabel: "R² = 0.47",
    addedLabel: "+4.6 pp",
    strong: true,
  },
  {
    label: "China → U.S.",
    sublabel: "Average ΔR² across 20 model configurations",
    baselinePct: 69.37,   // avg R² = 0.6937, U.S. own-country factors
    addedPct: 1.60,       // avg ΔR² = +0.0160 (0.6937 → 0.7097)
    baselineLabel: "R² = 0.69",
    addedLabel: "+1.6 pp",
    strong: false,
  },
];

export function ExplanatoryPowerDiagram() {
  return (
    <div className="relative rounded-sm border border-stone-200 bg-white/80 p-6 backdrop-blur-sm">
      <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400">
        Added Explanatory Power (ΔR²)
      </div>
      <div className="mb-5 text-[9px] text-stone-300 font-mono">
        avg across N=20 model configurations · OLS, Ridge, SpAM, Kernel
      </div>

      <div className="space-y-6">
        {BARS.map((bar, i) => (
          <motion.div
            key={bar.label}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 + i * 0.2 }}
          >
            {/* Row labels */}
            <div className="mb-2 flex items-baseline justify-between">
              <div>
                <span
                  className={`font-mono text-[9px] uppercase tracking-widest ${
                    bar.strong ? "text-[#A51C30]" : "text-stone-400"
                  }`}
                >
                  {bar.label}
                </span>
              </div>
              <span
                className={`font-mono text-[9px] font-medium ${
                  bar.strong ? "text-[#A51C30]" : "text-stone-400"
                }`}
              >
                {bar.addedLabel} gain
              </span>
            </div>

            {/* Segmented bar — baseline + added + empty */}
            <div className="relative flex h-7 w-full overflow-hidden rounded-[2px] bg-stone-50">
              {/* Baseline segment */}
              <div
                className="shrink-0 bg-stone-200 flex items-center justify-end pr-1.5"
                style={{ width: `${bar.baselinePct}%` }}
              >
                <span className="font-mono text-[8px] text-stone-500 whitespace-nowrap">
                  {bar.baselineLabel}
                </span>
              </div>
              {/* Hairline divider */}
              <div className="w-px shrink-0 bg-white" />
              {/* Added ΔR² segment — animates in */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(bar.addedPct, bar.strong ? bar.addedPct : 1)}%` }}
                transition={{
                  duration: 0.9,
                  delay: 0.7 + i * 0.2,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`shrink-0 flex items-center justify-center ${
                  bar.strong ? "bg-[#A51C30]/75" : "bg-stone-300"
                }`}
              />
              {/* Remaining empty */}
              <div className="flex-1" />
            </div>

            {/* Sub-label */}
            <div className="mt-1 font-mono text-[8px] text-stone-300">
              {bar.sublabel}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-5 border-t border-stone-100 pt-4">
        <div className="flex flex-wrap gap-4 text-[10px] text-stone-400">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-4 rounded-[2px] bg-stone-200" />
            <span>Own-country baseline</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-4 rounded-[2px] bg-[#A51C30]/75" />
            <span>Significant ΔR²</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-4 rounded-[2px] bg-stone-300" />
            <span>Negligible ΔR²</span>
          </div>
        </div>
      </div>
    </div>
  );
}
