"use client";

import { motion } from "framer-motion";

export function SignalDiagram() {
  return (
    <div className="relative rounded-sm border border-stone-200 bg-white/80 p-6 backdrop-blur-sm">
      <div className="mb-5 font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400">
        Signal Map
      </div>

      {/* Strong signal: U.S. → China */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mb-5 flex items-center gap-3"
      >
        <div className="shrink-0 rounded-sm border border-[#A51C30]/22 bg-[#A51C30]/8 px-3 py-2 text-center">
          <div className="text-[10px] uppercase tracking-widest text-[#A51C30]">U.S.</div>
          <div className="text-xs font-medium text-[#8a0e20]">Factors</div>
        </div>

        <div className="relative flex-1">
          {/* Solid arrow line */}
          <div className="h-[2px] w-full bg-[#A51C30]/55" />
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 border-y-[5px] border-l-[8px] border-y-transparent border-l-[#A51C30]/80"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded bg-white px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[#A51C30]">
              strong signal
            </span>
          </div>
        </div>

        <div className="shrink-0 rounded-sm border border-stone-200 bg-stone-50 px-3 py-2 text-center">
          <div className="text-[10px] uppercase tracking-widest text-stone-500">China</div>
          <div className="text-xs font-medium text-stone-700">Returns</div>
        </div>
      </motion.div>

      {/* Weak signal: China → U.S. */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="flex items-center gap-3"
      >
        <div className="shrink-0 rounded-sm border border-stone-200 bg-stone-50 px-3 py-2 text-center">
          <div className="text-[10px] uppercase tracking-widest text-stone-500">China</div>
          <div className="text-xs font-medium text-stone-700">Factors</div>
        </div>

        <div className="relative flex-1">
          {/* Dashed arrow line */}
          <div
            className="h-[1px] w-full bg-stone-300"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, #d6d3d1 0, #d6d3d1 6px, transparent 6px, transparent 12px)",
              background: "none",
              border: "none",
              borderTop: "1px dashed #d6d3d1",
            }}
          />
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 border-y-[4px] border-l-[7px] border-y-transparent border-l-stone-400"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded bg-white px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-stone-400">
              weak signal
            </span>
          </div>
        </div>

        <div className="shrink-0 rounded-sm border border-stone-200 bg-stone-50 px-3 py-2 text-center">
          <div className="text-[10px] uppercase tracking-widest text-stone-500">U.S.</div>
          <div className="text-xs font-medium text-stone-700">Returns</div>
        </div>
      </motion.div>

      <div className="mt-5 border-t border-stone-100 pt-4">
        <div className="flex gap-4 text-[10px] text-stone-400">
          <div className="flex items-center gap-1.5">
            <div className="h-[2px] w-5 bg-[#A51C30]/55" />
            <span>Strong predictive signal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="h-[1px] w-5"
              style={{ borderTop: "1px dashed #d6d3d1" }}
            />
            <span>Weak / inconsistent</span>
          </div>
        </div>
      </div>
    </div>
  );
}
