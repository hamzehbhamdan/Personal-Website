"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Download, ArrowRight, Mail, Linkedin, ExternalLink } from "lucide-react";

import { PixelBackground } from "@/components/thesis/PixelBackground";
import { ChapterNav, ChapterNavRow } from "@/components/thesis/ChapterNav";
import { ThesisSection } from "@/components/thesis/ThesisSection";
import { FigureCard } from "@/components/thesis/FigureCard";
import { FigureGallery } from "@/components/thesis/FigureGallery";
import { FilteredFigureGallery } from "@/components/thesis/FilteredFigureGallery";
import { LensTabs } from "@/components/thesis/LensTabs";
import { StatChips } from "@/components/thesis/StatChips";
import { KeyTakeaways } from "@/components/thesis/Callout";
import { SignalDiagram } from "@/components/thesis/SignalDiagram";
import { ExplanatoryPowerDiagram } from "@/components/thesis/ExplanatoryPowerDiagram";
import { TableAccordion } from "@/components/thesis/TableAccordion";
import { ThemesGrid } from "@/components/thesis/ThemesGrid";
import { KeyMetricsBar } from "@/components/thesis/KeyMetricsBar";
import { DataPipeline } from "@/components/thesis/DataPipeline";
import { FrameworkPanel } from "@/components/thesis/FrameworkPanel";
import { ModelGridDiagram } from "@/components/thesis/ModelGridDiagram";
import { PartialDependencePanel } from "@/components/thesis/PartialDependencePanel";
import { R2ComprehensiveTable } from "@/components/thesis/R2ComprehensiveTable";

import {
  THESIS_META,
  THESIS_HOOK,
  THESIS_HOOK_LEAD,
  THESIS_HOOK_SUPPORT,
  QUESTION_CONTENT,
  DATA_CONTENT,
  RESULTS_CHINA,
  RESULTS_US,
  INTERPRETATION,
  LIMITATIONS,
  STATISTICAL_FRAMEWORK,
  DATA_PROCESS,
  CITE,
} from "@/lib/thesis-content";

const serifStyle = { fontFamily: "var(--font-playfair), Georgia, 'Times New Roman', serif" };

function Divider() {
  return <div className="h-px w-full bg-stone-200" />;
}

// ── Result subsection ────────────────────────────────────────────────────────
function ResultSubsection({ data }: { data: typeof RESULTS_CHINA | typeof RESULTS_US }) {
  const isStrong = data.headline === "Strong Signal";

  return (
    <div id={data.id} className="space-y-8">
      {/* Direction label + headline */}
      <div>
        <div className="mb-3 flex items-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">
            Direction
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              isStrong ? "bg-[#A51C30]/12 text-[#A51C30]" : "bg-stone-100 text-stone-500"
            }`}
          >
            {data.direction}
          </span>
        </div>
        <h3
          className={`text-3xl font-bold ${isStrong ? "text-[#8a0e20]" : "text-stone-400"}`}
          style={serifStyle}
        >
          {data.headline}
        </h3>
        <p className="mt-2 text-base text-stone-600">{data.subheadline}</p>
      </div>

      {/* Stat cards — headline numbers per model */}
      {"statRows" in data && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(data.statRows as { model: string; spec: string; delta: string; detail: string; weak?: boolean }[]).map((row, i) => (
            <div
              key={i}
              className={`rounded-sm border p-3 ${
                row.weak
                  ? "border-stone-200 bg-stone-50"
                  : "border-[#A51C30]/15 bg-[#A51C30]/[0.03]"
              }`}
            >
              <p
                className={`text-xl font-bold tabular-nums leading-none ${
                  row.weak ? "text-stone-400" : "text-[#8a0e20]"
                }`}
              >
                {row.delta}
              </p>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-stone-700">
                {row.model}
              </p>
              <p className="mt-0.5 text-[10px] leading-snug text-stone-400">{row.spec}</p>
              <p className="mt-1 text-[10px] leading-snug text-stone-500">{row.detail}</p>
            </div>
          ))}
        </div>
      )}

      {/* Findings paragraph + key figure */}
      <div className="grid gap-8 md:grid-cols-2">
        {"findingsParagraph" in data && (
          <p className="text-sm leading-relaxed text-stone-600">
            {(data as typeof RESULTS_CHINA & { findingsParagraph: string }).findingsParagraph}
          </p>
        )}

        {/* Key figure */}
        <FigureCard
          src={data.figures[0].src}
          title={data.figures[0].title}
          caption={data.figures[0].caption}
        />
      </div>

      {/* Remaining figures in compact gallery */}
      {data.figures.length > 1 && (
        <div>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">
            Supporting Figures
          </p>
          <FigureGallery figures={data.figures.slice(1)} columns={3} />
        </div>
      )}

      {/* Tables accordion */}
      <TableAccordion tables={data.tables} />
    </div>
  );
}

// ── Scroll progress bar ───────────────────────────────────────────────────────
function ScrollProgress() {
  const [progress, setProgress] = React.useState(0)

  React.useEffect(() => {
    const update = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      if (scrollHeight <= 0) return
      setProgress((window.scrollY / scrollHeight) * 100)
    }
    window.addEventListener("scroll", update, { passive: true })
    update()
    return () => window.removeEventListener("scroll", update)
  }, [])

  return (
    <div
      className="fixed top-0 left-0 z-[100] h-[2px] bg-[#A51C30] transition-none"
      style={{ width: `${progress}%` }}
    />
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ThesisPage() {
  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="relative min-h-screen bg-[#f9f8f6] text-stone-900">
      <ScrollProgress />
      <PixelBackground />
      <ChapterNav />

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section
        id="hero"
        className="relative z-10 mx-auto flex min-h-[92vh] max-w-6xl flex-col justify-center px-6 py-24"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-12 flex items-center gap-2"
        >
          <Link href="/" className="font-mono text-[11px] text-stone-400 transition-colors hover:text-stone-600">
            hamzehhamdan.com
          </Link>
          <span className="text-stone-300">/</span>
          <span className="font-mono text-[11px] text-stone-400">thesis</span>
        </motion.div>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left: Title block */}
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-stone-400"
            >
              {THESIS_META.institution} · {THESIS_META.type} · {THESIS_META.date}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl font-bold leading-[1.05] tracking-tight text-stone-900 sm:text-6xl lg:text-7xl"
              style={serifStyle}
            >
              {THESIS_META.title}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-5 text-lg leading-relaxed text-stone-500"
            >
              {THESIS_META.tagline}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="mt-6 max-w-md space-y-2"
            >
              <p className="text-base font-medium leading-snug text-stone-700">
                {THESIS_HOOK_LEAD}
              </p>
              <p className="text-sm leading-relaxed text-stone-500">
                {THESIS_HOOK_SUPPORT}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <button
                onClick={() => scrollTo("the-question")}
                className="flex items-center gap-2 rounded-sm bg-stone-900 px-4 py-2 text-sm text-white transition-colors hover:bg-stone-700"
              >
                Read the Thesis <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href={THESIS_META.pdfUrl}
                className="flex items-center gap-2 rounded-sm border border-stone-300 px-4 py-2 text-sm text-stone-600 transition-colors hover:border-stone-500 hover:text-stone-800"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="h-4 w-4" /> Download PDF
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="mt-6 space-y-0.5"
            >
              <p className="font-mono text-xs text-stone-400">
                {THESIS_META.author} — {THESIS_META.institution}
              </p>
              <p className="font-mono text-[10px] text-stone-300">
                {THESIS_META.advisor}
              </p>
            </motion.div>
          </div>

          {/* Right: Diagrams */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col gap-4"
          >
            <SignalDiagram />
            <ExplanatoryPowerDiagram />
          </motion.div>
        </div>

        {/* Chapter nav row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-16"
        >
          <Divider />
          <div className="py-5">
            <ChapterNavRow />
          </div>
          <Divider />
        </motion.div>
      </section>

      {/* ── 01 THE QUESTION ────────────────────────────────────────── */}
      <ThesisSection id="the-question" label="01 — The Question">
        <h2 className="mb-6 text-3xl font-bold leading-snug text-stone-900 sm:text-4xl" style={serifStyle}>
          {QUESTION_CONTENT.headline}
        </h2>

        <p className="text-base leading-relaxed text-stone-600">{QUESTION_CONTENT.body}</p>

        <p className="mb-4 text-sm text-stone-500">
          This thesis operationalizes two distinct predictive tasks:
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {QUESTION_CONTENT.buttons.map((btn) => (
            <button
              key={btn.anchor}
              onClick={() => scrollTo(btn.anchor)}
              className="group rounded-sm border border-stone-200 bg-white/70 p-5 text-left transition-all hover:border-[#A51C30]/32 hover:shadow-sm"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-stone-800">{btn.label}</span>
                <ArrowRight className="h-4 w-4 text-stone-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#A51C30]/80" />
              </div>
              <p className="text-xs leading-relaxed text-stone-500">{btn.description}</p>
            </button>
          ))}
        </div>
      </ThesisSection>

      <Divider />

      {/* ── 02 FRAMEWORK ─────────────────────────────────────────────── */}
      <ThesisSection id="framework" label="02 — The Framework" wide>
        <h2 className="mb-4 text-3xl font-bold text-stone-900 sm:text-4xl" style={serifStyle}>
          {STATISTICAL_FRAMEWORK.headline}
        </h2>
        <p className="mb-8 max-w-2xl text-base leading-relaxed text-stone-600">
          {STATISTICAL_FRAMEWORK.intro}
        </p>
        <FrameworkPanel />
      </ThesisSection>

      <Divider />

      {/* ── 03 DATA UNIVERSE ─────────────────────────────────────────── */}
      <ThesisSection id="data-universe" label="03 — The Data Universe" wide>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          {/* Left: text + stats */}
          <div>
            <h2 className="mb-4 text-3xl font-bold text-stone-900 sm:text-4xl" style={serifStyle}>
              A Large Panel of Macro-Financial Signals
            </h2>
            <p className="mb-8 text-base leading-relaxed text-stone-600">{DATA_CONTENT.intro}</p>
            <StatChips stats={DATA_CONTENT.stats} />

            {/* Context callout */}
            <div className="mt-8 rounded-sm border border-stone-200 bg-white/60 p-4">
              <p className="text-xs leading-relaxed text-stone-500">
                <span className="font-semibold text-stone-700">Coverage note: </span>
                Factor availability varies substantially across time. Earlier periods (pre-2005) have
                higher missingness, particularly for China-specific factors. The effective joint sample
                is constrained by the shorter Chinese factor history. See figures 06–09 for full
                missingness analysis.
              </p>
            </div>
          </div>

          {/* Right: compact figure gallery */}
          <div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">
              Figures — click any to expand
            </p>
            <FilteredFigureGallery figures={DATA_CONTENT.figures} columns={3} />
          </div>
        </div>

        {/* Themes grid — full width below the two-column layout */}
        <div className="mt-10">
          <ThemesGrid />
        </div>
      </ThesisSection>

      <Divider />

      {/* ── 04 DATA PROCESS ──────────────────────────────────────────── */}
      <ThesisSection id="data-process" label="04 — Data Processing" wide>
        <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
          {/* Left: intro */}
          <div>
            <h2 className="mb-4 text-3xl font-bold text-stone-900 sm:text-4xl" style={serifStyle}>
              From Raw Factors to a Model-Ready Panel
            </h2>
            <p className="mb-6 text-base leading-relaxed text-stone-600">{DATA_PROCESS.intro}</p>

            {/* Quick stat summary */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "1.43%", label: "Cells winsorized", sub: "0.05th – 99.95th pct" },
                { value: "17", label: "Return outliers kept", sub: "6 U.S. + 11 China" },
                { value: "23", label: "Columns transformed", sub: "ADF / KPSS tests" },
                { value: "2", label: "Columns excluded", sub: "Irresolvable non-stationarity" },
              ].map((s) => (
                <div key={s.label} className="rounded-sm border border-stone-200 bg-white/70 p-3 text-center">
                  <div className="text-lg font-bold tabular-nums text-stone-800">{s.value}</div>
                  <div className="text-[11px] font-medium text-stone-600">{s.label}</div>
                  <div className="mt-0.5 font-mono text-[9px] text-stone-400">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: pipeline */}
          <div>
            <DataPipeline />
          </div>
        </div>
      </ThesisSection>

      <Divider />

      {/* ── 05 METHODS ───────────────────────────────────────────────── */}
      <ThesisSection id="methods" label="05 — Methods as Lenses" wide>
        <h2 className="mb-4 text-3xl font-bold text-stone-900 sm:text-4xl" style={serifStyle}>
          Three Lenses, 192 Models
        </h2>
        <p className="mb-2 max-w-2xl text-base leading-relaxed text-stone-600">
          Rather than committing to a single model class, this thesis applies three methodologically
          distinct approaches — from structured linear regularization to fully nonparametric kernel
          smoothing. Each lens illuminates a different aspect of the factor-return relationship, and
          comparing their performance is itself informative.
        </p>
        <p className="mb-8 max-w-2xl text-sm leading-relaxed text-stone-500">
          In total, {192} models were estimated across all combinations of method, predictor granularity,
          time window, target market, and predictor origin. If the asymmetry is real, it should appear across the grid.
        </p>

        {/* Model grid breakdown */}
        <div className="mb-10">
          <ModelGridDiagram />
        </div>

        <div className="h-px w-full bg-stone-100 my-8" />

        {/* Lens detail tabs */}
        <div>
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">
            Each Method in Detail
          </p>
          <LensTabs />
        </div>
      </ThesisSection>

      <Divider />

      {/* ── 06 RESULTS ───────────────────────────────────────────────── */}
      <ThesisSection id="results" label="06 — Results" wide>
        <h2 className="mb-4 text-3xl font-bold text-stone-900 sm:text-4xl" style={serifStyle}>
          An Asymmetric Picture
        </h2>
        <p className="mb-8 max-w-2xl text-base leading-relaxed text-stone-600">
          The results tell a consistent story across all three model classes: information flows more
          readily from U.S. macro-financial conditions into Chinese equity markets than in the
          reverse direction.
        </p>

        {/* R² at a glance — legacy bar */}
        <div className="mb-6">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">
            R² at a Glance — Primary Results
          </p>
          <KeyMetricsBar />
        </div>

        {/* Comprehensive table */}
        <div className="mb-8">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">
            All Model Results — Complete R² Comparison
          </p>
          <R2ComprehensiveTable />
        </div>

        {/* Cross-direction comparison table */}
        <div className="mb-12 rounded-sm border border-stone-200 bg-white/70 overflow-hidden">
          <div className="border-b border-stone-100 px-5 py-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400">
              Cross-Direction Comparison — ΔR² by Model Class
            </p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50">
                <th className="px-5 py-2.5 text-left font-mono text-[9px] uppercase tracking-wider text-stone-400">Model</th>
                <th className="px-5 py-2.5 text-right font-mono text-[9px] uppercase tracking-wider text-[#A51C30]/70">U.S. → China ΔR²</th>
                <th className="px-5 py-2.5 text-right font-mono text-[9px] uppercase tracking-wider text-stone-400">China → U.S. ΔR²</th>
                <th className="px-5 py-2.5 text-right font-mono text-[9px] uppercase tracking-wider text-stone-400">Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {[
                { model: "OLS", spec: "daily · 2016–2024", usChina: "+7.8 pp", chinaUs: "—", ratio: "—" },
                { model: "Ridge", spec: "daily · 2001–2024", usChina: "+2.2 pp", chinaUs: "+0.7 pp", ratio: "3.1×" },
                { model: "SpAM", spec: "monthly · 2001–2024", usChina: "+4.0 pp", chinaUs: "+1.8 pp", ratio: "2.2×" },
                { model: "Kernel", spec: "cross-country only", usChina: "R² 0.112", chinaUs: "R² ≈ 0", ratio: "∞" },
              ].map((row) => (
                <tr key={row.model} className="hover:bg-stone-50/40 transition-colors">
                  <td className="px-5 py-3">
                    <span className="text-xs font-semibold text-stone-700">{row.model}</span>
                    <span className="ml-2 font-mono text-[9px] text-stone-400">{row.spec}</span>
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-xs font-bold text-[#8a0e20]">{row.usChina}</td>
                  <td className="px-5 py-3 text-right font-mono text-xs text-stone-500">{row.chinaUs}</td>
                  <td className="px-5 py-3 text-right font-mono text-xs text-stone-400">{row.ratio}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-stone-100 bg-stone-50/30 px-5 py-2.5">
            <p className="text-[10px] leading-relaxed text-stone-400">
              Ratio = (U.S.→China ΔR²) ÷ (China→U.S. ΔR²). OLS was estimated for Chinese returns only (shorter window). Kernel row shows cross-country-only R², not ΔR².
            </p>
          </div>
        </div>

        <ResultSubsection data={RESULTS_CHINA} />

        <div className="my-14 h-px w-full bg-stone-200" />

        <ResultSubsection data={RESULTS_US} />

        {/* Partial dependence section */}
        <div className="mt-14 pt-10 border-t border-stone-100">
          <h3 className="mb-4 text-2xl font-bold text-stone-900" style={serifStyle}>
            Nonlinear Relationships — Partial Dependence Analysis
          </h3>
          <PartialDependencePanel />
        </div>
      </ThesisSection>

      <Divider />

      {/* ── 07 INTERPRETATION ────────────────────────────────────────── */}
      <ThesisSection id="interpretation" label="07 — Interpretation">
        <h2 className="mb-10 text-3xl font-bold text-stone-900 sm:text-4xl" style={serifStyle}>
          What the Data Is Saying
        </h2>

        <div className="space-y-10">
          {INTERPRETATION.opEd.map((item, i) => (
            <div key={i}>
              <h3 className="mb-3 text-xl font-bold text-stone-800" style={serifStyle}>
                {item.headline}
              </h3>
              <p className="text-base leading-relaxed text-stone-600">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <KeyTakeaways items={INTERPRETATION.takeaways} />
        </div>

        <div className="mt-12">
          <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">
            So What? — Implications by Audience
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {INTERPRETATION.audiences.map((aud) => (
              <div key={aud.label} className="rounded-sm border border-stone-200 bg-white/60 p-5">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
                  {aud.label}
                </div>
                <p className="text-sm leading-relaxed text-stone-600">{aud.body}</p>
              </div>
            ))}
          </div>
        </div>
      </ThesisSection>

      <Divider />

      {/* ── 08 LIMITATIONS ───────────────────────────────────────────── */}
      <ThesisSection id="limitations" label="08 — Limitations & Future Work">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          {/* Left: limitation items */}
          <div>
            <h2 className="mb-6 text-3xl font-bold text-stone-900 sm:text-4xl" style={serifStyle}>
              Limitations
            </h2>
            <p className="mb-8 text-sm leading-relaxed text-stone-500">
              Empirical results are only as good as their honest accounting of what the analysis
              cannot establish. The following limitations are structural, not incidental.
            </p>
            <div className="space-y-5">
              {LIMITATIONS.items.map((item, i) => (
                <div key={i} className="border-l-2 border-stone-200 pl-4">
                  <h4 className="mb-1 text-sm font-semibold text-stone-800">{item.title}</h4>
                  <p className="text-sm leading-relaxed text-stone-600">{item.body}</p>
                  {/* CUSUM figures appear inline under Nonstationarity & Structural Breaks */}
                  {i === 2 && (
                    <div className="mt-4">
                      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">
                        Structural Stability Tests
                      </p>
                      <FigureGallery figures={LIMITATIONS.figures} columns={2} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: future work */}
          <div className="space-y-8">
            {/* Future directions */}
            <div className="rounded-sm border border-stone-200 bg-white/60 p-5">
              <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">
                Future Directions
              </div>
              <ul className="space-y-3">
                {LIMITATIONS.futurework.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed text-stone-600">
                    <span className="shrink-0 font-mono text-[10px] text-[#A51C30]/80">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </ThesisSection>

      <Divider />

      {/* ── 09 DOWNLOAD / CITE ───────────────────────────────────────── */}
      <ThesisSection id="download" label="09 — Download & Cite">
        <h2 className="mb-2 text-3xl font-bold text-stone-900 sm:text-4xl" style={serifStyle}>
          Access the Full Work
        </h2>
        <p className="mb-8 text-base text-stone-500">
          The complete thesis, including all appendices and supplemental material.
        </p>

        {/* Download button */}
        <a
          href={THESIS_META.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group mb-10 flex w-full items-center justify-between rounded-sm border border-stone-200 bg-white/70 px-6 py-4 transition-all hover:border-stone-400"
        >
          <div>
            <div className="text-sm font-semibold text-stone-800">Download Thesis PDF</div>
            <div className="mt-0.5 font-mono text-[10px] text-stone-400">
              {THESIS_META.title} — {THESIS_META.author}, {THESIS_META.date}
            </div>
          </div>
          <Download className="h-5 w-5 text-stone-400 transition-colors group-hover:text-stone-700" />
        </a>

        {/* Cite this work */}
        <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">
          Cite This Work
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-1.5 text-xs font-medium text-stone-500">BibTeX</div>
            <div className="rounded-sm border border-stone-200 bg-stone-900 p-4">
              <pre className="overflow-x-auto whitespace-pre font-mono text-xs leading-relaxed text-stone-200">
                {CITE.bibtex}
              </pre>
            </div>
          </div>
          <div>
            <div className="mb-1.5 text-xs font-medium text-stone-500">APA</div>
            <div className="rounded-sm border border-stone-200 bg-stone-50 px-4 py-3 font-mono text-xs leading-relaxed text-stone-600">
              {CITE.apa}
            </div>

            {/* Contact */}
            <div className="mt-6">
              <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">
                Contact
              </div>
              <div className="flex flex-col gap-2">
                <a
                  href={`mailto:${THESIS_META.email}`}
                  className="flex items-center gap-2 text-sm text-stone-500 transition-colors hover:text-[#A51C30]"
                >
                  <Mail className="h-4 w-4" />
                  {THESIS_META.email}
                </a>
                <a
                  href={THESIS_META.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-stone-500 transition-colors hover:text-[#A51C30]"
                >
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

      </ThesisSection>

      {/* Footer */}
      <footer className="relative z-10 border-t border-stone-200 bg-white/50 px-6 py-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <span className="font-mono text-[10px] text-stone-400">
            © {new Date().getFullYear()} {THESIS_META.author}
          </span>
          <Link
            href="/"
            className="font-mono text-[10px] text-stone-400 transition-colors hover:text-stone-700"
          >
            ← Back to hamzehhamdan.com
          </Link>
        </div>
      </footer>
    </div>
  );
}
