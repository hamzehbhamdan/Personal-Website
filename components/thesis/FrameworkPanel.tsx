"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { STATISTICAL_FRAMEWORK } from "@/lib/thesis-content";
import { TeX, BlockTeX } from "./Math";

// ── Step-through derivation ───────────────────────────────────────────────────
const DERIVATION_STEPS = [
  {
    label: "Objective",
    description: "Minimize mean-squared prediction error over the weight vector w:",
    latex: "\\min_{\\mathbf{w}} \\; \\mathbb{E}\\!\\left[(R_M - \\mathbf{w}^\\top \\mathbf{X})^2\\right]",
  },
  {
    label: "Expand",
    description: "Expand the square and separate into terms involving w:",
    latex: "= \\mathbb{E}[R_M^2] \\;-\\; 2\\,\\mathbf{w}^\\top\\underbrace{\\mathbb{E}[\\mathbf{X}\\,R_M]}_{\\boldsymbol{\\sigma}_M} \\;+\\; \\mathbf{w}^\\top\\underbrace{\\mathbb{E}[\\mathbf{X}\\mathbf{X}^\\top]}_{\\boldsymbol{\\Sigma}}\\mathbf{w}",
  },
  {
    label: "FOC",
    description: "Differentiate with respect to w and set equal to zero:",
    latex: "\\frac{\\partial}{\\partial \\mathbf{w}} = -2\\,\\boldsymbol{\\sigma}_M + 2\\,\\boldsymbol{\\Sigma}\\,\\mathbf{w} = \\mathbf{0}",
  },
  {
    label: "Rearrange",
    description: "Isolate the factor covariance matrix on the left-hand side:",
    latex: "\\boldsymbol{\\Sigma}\\,\\mathbf{w} = \\boldsymbol{\\sigma}_M",
  },
  {
    label: "Solution",
    description: "Pre-multiply both sides by Σ⁻¹ to obtain the optimal weights:",
    latex: "\\mathbf{w}^* = \\boldsymbol{\\Sigma}^{-1}\\boldsymbol{\\sigma}_M",
    highlight: true,
  },
];

// Embedded = no outer wrapper (renders inside a shared card)
function DerivationStepper({ embedded = false }: { embedded?: boolean }) {
  const [step, setStep] = useState(0);
  const current = DERIVATION_STEPS[step];
  const total = DERIVATION_STEPS.length;

  const inner = (
    <>
      {/* Step tabs */}
      <div className="flex overflow-x-auto border-b border-stone-100 bg-stone-50/60">
        {DERIVATION_STEPS.map((s, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className={`shrink-0 px-3 py-2 text-left transition-all ${
              i === step
                ? "border-b-2 border-[#A51C30] bg-white text-stone-800"
                : "text-stone-400 hover:text-stone-600"
            }`}
          >
            <span className="block font-mono text-[8px] uppercase tracking-wider">Step {i + 1}</span>
            <span className="block text-[10px] font-medium leading-tight">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="p-5"
        >
          <p className="mb-4 text-sm text-stone-500">{current.description}</p>
          <div
            className={`flex items-center justify-center rounded-sm px-4 py-5 ${
              current.highlight ? "bg-[#A51C30] shadow-sm" : "bg-stone-900"
            }`}
          >
            <BlockTeX className={current.highlight ? "[&_.katex]:text-white" : "[&_.katex]:text-stone-100"}>
              {current.latex}
            </BlockTeX>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-stone-100 px-4 py-2.5">
        <button
          onClick={() => setStep((p) => Math.max(0, p - 1))}
          disabled={step === 0}
          className="flex items-center gap-1.5 font-mono text-[9px] text-stone-400 hover:text-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          PREV
        </button>
        <div className="flex gap-1">
          {DERIVATION_STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-4 bg-[#A51C30]" : "w-1.5 bg-stone-200 hover:bg-stone-300"
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => setStep((p) => Math.min(total - 1, p + 1))}
          disabled={step === total - 1}
          className="flex items-center gap-1.5 font-mono text-[9px] text-stone-400 hover:text-stone-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          NEXT
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </>
  );

  if (embedded) return <>{inner}</>;
  return <div className="rounded-sm border border-stone-200 bg-white/70 overflow-hidden">{inner}</div>;
}

// ── Main export ───────────────────────────────────────────────────────────────
export function FrameworkPanel() {
  return (
    <div className="lg:flex lg:gap-10 lg:items-start">

      {/* ── Main content column ── */}
      <div className="flex-1 min-w-0 space-y-6">

        {/* 1. Core Idea */}
        <div className="rounded-sm border border-stone-200 bg-white/70 p-5">
          <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400">
            The Core Idea
          </p>
          <h3 className="mb-2 text-base font-semibold text-stone-800">
            {STATISTICAL_FRAMEWORK.coreIdea.title}
          </h3>
          <p className="text-sm leading-relaxed text-stone-600">
            {STATISTICAL_FRAMEWORK.coreIdea.body}
          </p>
        </div>

        {/* 2. Mathematical Problem + Derivation — unified card */}
        <div>
          <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400">
            Mathematical Problem & Derivation
          </p>
          <div className="rounded-sm border border-stone-200 bg-white/70 overflow-hidden">
            {/* Prose preamble */}
            <div className="p-5 border-b border-stone-100">
              <p className="mb-3 text-sm leading-relaxed text-stone-600">
                {STATISTICAL_FRAMEWORK.framework.setup}
              </p>
              <p className="text-sm leading-relaxed text-stone-600">
                Expanding the squared error reveals two key quantities:{" "}
                <strong className="text-stone-700">Σ = Cov(X, X)</strong> (the N×N factor covariance matrix) and{" "}
                <strong className="text-stone-700">σ_M = Cov(X, R_M)</strong> (the factor–return covariance vector).
                Step through the derivation below to see how these lead to the closed-form solution.
              </p>
            </div>
            {/* Stepper embedded inside the same card */}
            <DerivationStepper embedded />
          </div>
        </div>

        {/* 3. Interpretation */}
        <div className="rounded-sm border border-stone-200 bg-white/70 p-5">
          <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400">
            Interpretation
          </p>
          <p className="text-sm leading-relaxed text-stone-600">
            {STATISTICAL_FRAMEWORK.framework.interpretation}
          </p>
        </div>

        {/* 4. ΔR² callout */}
        <div className="rounded-sm border-l-2 border-[#A51C30]/40 bg-[#A51C30]/4 p-5">
          <p className="mb-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-[#A51C30]/70">
            The ΔR² Test
          </p>
          <p className="mb-4 text-sm leading-relaxed text-stone-600">
            {STATISTICAL_FRAMEWORK.crossMarketExtension}
          </p>
          <div className="rounded-sm bg-white/80 border border-[#A51C30]/15 px-3 py-2 text-center">
            <TeX display={false}>
              {"\\Delta R^2 = R^2_{\\text{combined}} - R^2_{\\text{domestic}}"}
            </TeX>
          </div>
        </div>

        {/* 5. 5 Advantages */}
        <div>
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">
            Why Replication? — 5 Advantages Over Bivariate Correlation
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {STATISTICAL_FRAMEWORK.advantages.map((adv, i) => (
              <motion.div
                key={adv.number}
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: 0.07 * i }}
                className="rounded-sm border border-stone-100 bg-white/70 p-4"
              >
                <div className="mb-2 font-mono text-[9px] text-[#A51C30]/70">{adv.number}</div>
                <div className="mb-1.5 text-xs font-semibold text-stone-800">{adv.title}</div>
                <p className="text-[11px] leading-relaxed text-stone-500">{adv.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Literature sidebar (right, ~25% width on lg+) ── */}
      <div className="mt-8 lg:mt-0 lg:w-56 shrink-0">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">
          Literature
        </p>
        <div className="space-y-3">
          {STATISTICAL_FRAMEWORK.literature.map((item, i) => (
            <div key={i} className="rounded-sm border border-stone-100 bg-white/60 p-3">
              <div className="mb-1.5 font-mono text-[9px] font-medium text-stone-700">
                {item.citation}
              </div>
              <p className="text-[10px] leading-relaxed text-stone-500">{item.point}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
