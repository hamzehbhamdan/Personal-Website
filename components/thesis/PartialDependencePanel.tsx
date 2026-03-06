"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { PARTIAL_DEPENDENCE } from "@/lib/thesis-content";

type TabId = "spam" | "kernel";

interface PDPCard {
  factor: string;
  direction: string;
  shape: string;
  finding: string;
  economic: string;
  src?: string;  // optional PDP plot image
  figureLabel?: string; // e.g. "Figure B.0.17"
}

function PDPCardView({ card, index }: { card: PDPCard; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 * index }}
      className="rounded-sm border border-stone-100 bg-white/70 overflow-hidden"
    >
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full p-4 text-left hover:bg-stone-50/80 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-stone-800">{card.factor}</span>
              <span className="rounded-full bg-stone-100 px-2 py-0.5 font-mono text-[8px] text-stone-500">
                → {card.direction}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-[#A51C30]/50" />
              <span className="font-mono text-[9px] italic text-stone-500">{card.shape}</span>
            </div>
          </div>
          <svg
            className={`mt-0.5 h-4 w-4 shrink-0 text-stone-400 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="border-t border-stone-100 p-4 space-y-3">
              {/* Optional PDP plot image */}
              {card.src && (
                <div className="overflow-hidden rounded-sm border border-stone-200 bg-stone-50">
                  {card.figureLabel && (
                    <div className="border-b border-stone-100 px-3 py-1.5">
                      <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-400">
                        {card.figureLabel}
                      </span>
                    </div>
                  )}
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src={`/figures/${card.src}`}
                      alt={`Partial dependence plot: ${card.factor} → ${card.direction}`}
                      fill
                      className="object-contain p-2"
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                </div>
              )}
              <p className="text-sm leading-relaxed text-stone-600">{card.finding}</p>
              <div className="rounded-sm bg-stone-50 px-3 py-2.5">
                <p className="mb-0.5 font-mono text-[8px] uppercase tracking-wider text-stone-400">
                  Economic Interpretation
                </p>
                <p className="text-[11px] leading-relaxed text-stone-600">{card.economic}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function PartialDependencePanel() {
  const [activeTab, setActiveTab] = useState<TabId>("spam");

  const tabs: { id: TabId; label: string }[] = [
    { id: "spam", label: "SpAM (pyGAM)" },
    { id: "kernel", label: "Kernel (NW)" },
  ];

  const spamAll: PDPCard[] = [
    ...PARTIAL_DEPENDENCE.spam.chinaReturns,
    ...PARTIAL_DEPENDENCE.spam.usReturns,
  ];

  const kernelAll: PDPCard[] = PARTIAL_DEPENDENCE.kernel.chinaReturns;

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-base leading-relaxed text-stone-600">
          {PARTIAL_DEPENDENCE.intro}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-sm border border-stone-200 bg-stone-50 p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-sm px-4 py-1.5 text-xs font-medium transition-all ${
              activeTab === tab.id
                ? "bg-white text-stone-800 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          {activeTab === "spam" && (
            <>
              <div>
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">
                  {PARTIAL_DEPENDENCE.spam.headline}
                </p>
                <div className="space-y-2">
                  {spamAll.map((card, i) => (
                    <PDPCardView key={`${card.factor}-${card.direction}`} card={card} index={i} />
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === "kernel" && (
            <>
              <div>
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">
                  {PARTIAL_DEPENDENCE.kernel.headline}
                </p>
                <div className="space-y-2">
                  {kernelAll.map((card, i) => (
                    <PDPCardView key={`${card.factor}-${card.direction}`} card={card} index={i} />
                  ))}
                </div>
                <div className="mt-4 rounded-sm border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="font-mono text-[9px] uppercase tracking-wider text-amber-700 mb-1">Overfitting Note</p>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    {PARTIAL_DEPENDENCE.kernel.artifactsNote}
                  </p>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
