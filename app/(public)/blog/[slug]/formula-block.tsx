"use client"

import { useState } from "react"

const serif = { fontFamily: "var(--font-playfair), Georgia, 'Times New Roman', serif" }

// ── Individual term rows ──────────────────────────────────────────────────────

interface TermRow {
    n: string
    coefficient: string
    exponent: string | null
    description: string
    isEllipsis?: boolean
}

const fourierTerms: TermRow[] = [
    { n: "0", coefficient: "c₀", exponent: null, description: "stationary offset — shifts the center of the drawing" },
    { n: "+1", coefficient: "c₁", exponent: "2πit/T", description: "1 revolution per period, counter-clockwise ↺" },
    { n: "−1", coefficient: "c₋₁", exponent: "−2πit/T", description: "1 revolution per period, clockwise ↻" },
    { n: "+2", coefficient: "c₂", exponent: "4πit/T", description: "2 revolutions per period, counter-clockwise ↺" },
    { n: "−2", coefficient: "c₋₂", exponent: "−4πit/T", description: "2 revolutions per period, clockwise ↻" },
    { n: "+3", coefficient: "c₃", exponent: "6πit/T", description: "3 revolutions per period, counter-clockwise ↺" },
    { n: "−3", coefficient: "c₋₃", exponent: "−6πit/T", description: "3 revolutions per period, clockwise ↻" },
    { n: "+4", coefficient: "c₄", exponent: "8πit/T", description: "4 revolutions per period, counter-clockwise ↺" },
    { n: "−4", coefficient: "c₋₄", exponent: "−8πit/T", description: "4 revolutions per period, clockwise ↻" },
    { n: "+5", coefficient: "c₅", exponent: "10πit/T", description: "5 revolutions per period, counter-clockwise ↺" },
    { n: "−5", coefficient: "c₋₅", exponent: "−10πit/T", description: "5 revolutions per period, clockwise ↻" },
    { n: "±N", coefficient: "cₙ", exponent: "2πint/T", description: "N revolutions — captures the finest detail in the path", isEllipsis: true },
]

// ── Interpretation key rows ──────────────────────────────────────────────────

const interpretationRows = [
    {
        symbol: "cₙ",
        symbolColor: "text-[#A51C30]",
        label: "Complex coefficient",
        description: "Encodes the nth circle. Its magnitude |cₙ| is the radius of the circle; its argument ∠cₙ is the starting angle.",
    },
    {
        symbol: "n",
        symbolColor: "text-stone-700",
        label: "Harmonic number",
        description: "Which frequency. n = 0 is a static offset. n = ±1 is the fundamental. n = ±2 is the second harmonic, spinning twice as fast.",
    },
    {
        symbol: "e^(…)",
        symbolColor: "text-stone-600",
        label: "Complex exponential",
        description: "A unit circle in the complex plane rotating at frequency n. As t goes from 0 to T, e^(2πint/T) completes exactly n full rotations.",
    },
    {
        symbol: "T",
        symbolColor: "text-stone-700",
        label: "Period",
        description: "The time for one complete cycle — how long it takes the path to close and start over.",
    },
]

// ── DFT coefficient interpretation ──────────────────────────────────────────

const dftInterpretation = [
    {
        symbol: "z(k)",
        symbolColor: "text-[#A51C30]",
        label: "Sampled path point",
        description: "The k-th point on the path, encoded as a complex number: z(k) = x(k) + i·y(k). This treats the 2D coordinate as a complex number.",
    },
    {
        symbol: "e^(−2πink/N)",
        symbolColor: "text-stone-600",
        label: "Analysis kernel",
        description: "A rotating reference signal at frequency n. Multiplying by this and summing over all k measures how much of frequency n is present in the path.",
    },
    {
        symbol: "1/N",
        symbolColor: "text-stone-700",
        label: "Normalization",
        description: "Divides by the number of samples so that the coefficients don't grow with path resolution — cₙ represents amplitude, not total energy.",
    },
    {
        symbol: "N",
        symbolColor: "text-stone-700",
        label: "Sample count",
        description: "The number of evenly-spaced points sampled from the path. More samples → more frequencies computed → finer reconstruction.",
    },
]

// ── Fourier Series Formula ────────────────────────────────────────────────────

export function FourierSeriesFormula({ defaultExpanded = false }: { defaultExpanded?: boolean } = {}) {
    const [expanded, setExpanded] = useState(defaultExpanded)

    return (
        <div className="my-10 overflow-hidden rounded-sm border border-stone-200 bg-white/80">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 border-b border-stone-100 px-5 py-3">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400 leading-relaxed">
                    Fourier Series — complex exponential form
                </span>
                <span className="font-mono text-[8px] text-stone-300 shrink-0">f(t) = Σ cₙ·e^(…)</span>
            </div>

            {/* Main formula display */}
            <div className="px-6 py-8">
                <div className="flex items-center justify-center gap-3 overflow-x-auto pb-2">
                    {/* f(t) = */}
                    <span className="shrink-0 text-2xl text-stone-900" style={serif}>
                        f(t)
                    </span>
                    <span className="shrink-0 text-xl text-stone-400">=</span>

                    {/* Summation */}
                    <span className="inline-flex shrink-0 flex-col items-center leading-none">
                        <span className="font-mono text-[11px] text-stone-500">∞</span>
                        <span className="text-5xl font-light text-stone-400 leading-[0.85]">Σ</span>
                        <span className="font-mono text-[10px] text-stone-500">n =−∞</span>
                    </span>

                    {/* cₙ */}
                    <span className="shrink-0 text-2xl text-[#A51C30]" style={serif}>
                        c<sub className="text-base">n</sub>
                    </span>

                    {/* · */}
                    <span className="shrink-0 text-xl text-stone-300">·</span>

                    {/* e^(2πint/T) */}
                    <span className="shrink-0 text-2xl text-stone-700" style={serif}>
                        e
                        <sup className="font-mono text-sm text-stone-500">
                            2πin<span className="italic text-stone-700">t</span>/T
                        </sup>
                    </span>
                </div>

                {/* Expand / collapse button */}
                <div className="mt-6 flex justify-center">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="inline-flex items-center gap-2 rounded-sm border border-stone-200 bg-stone-50 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.15em] text-stone-500 transition-all hover:border-stone-300 hover:bg-white hover:text-stone-700"
                    >
                        <span
                            className="inline-block transition-transform duration-200"
                            style={{ transform: expanded ? "rotate(45deg)" : "rotate(0deg)" }}
                        >
                            +
                        </span>
                        {expanded ? "Collapse terms" : "See the full term-by-term expansion"}
                    </button>
                </div>

                {/* Expanded terms */}
                {expanded && (
                    <div className="mt-6 overflow-hidden rounded-sm border border-stone-100 bg-stone-50">
                        <div className="border-b border-stone-100 px-4 py-2">
                            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-stone-400">
                                Term-by-term expansion — each row is one spinning circle
                            </span>
                        </div>

                        {/* f(t) ≈ header */}
                        <div className="px-5 pt-4 pb-2">
                            <span className="text-sm text-stone-600" style={serif}>
                                f(t) ≈
                            </span>
                        </div>

                        <div className="divide-y divide-stone-100">
                            {fourierTerms.map((term, i) => (
                                <div
                                    key={i}
                                    className="flex items-start gap-0 px-5 py-2.5"
                                >
                                    {/* Plus sign (or blank for first) */}
                                    <span className="w-5 shrink-0 font-mono text-[11px] text-stone-300 pt-0.5">
                                        {i === 0 ? "" : "+"}
                                    </span>

                                    {/* The term itself */}
                                    <span className="w-28 sm:w-56 shrink-0 font-mono text-[11px] text-stone-800" style={serif}>
                                        {term.isEllipsis ? (
                                            <span className="text-stone-400">···</span>
                                        ) : (
                                            <>
                                                <span className="text-[#A51C30]">{term.coefficient}</span>
                                                {term.exponent && (
                                                    <>
                                                        <span className="text-stone-400"> · </span>
                                                        <span className="text-stone-700">
                                                            e<sup className="text-[9px]">{term.exponent}</sup>
                                                        </span>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </span>

                                    {/* n label + description */}
                                    <div className="flex items-start gap-3">
                                        <span className="shrink-0 rounded-sm bg-stone-200/60 px-1.5 py-0.5 font-mono text-[8px] text-stone-500">
                                            n={term.n}
                                        </span>
                                        <span className="text-[10px] leading-relaxed text-stone-400">
                                            {term.description}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-stone-100 bg-stone-100/50 px-5 py-2.5">
                            <span className="font-mono text-[8px] text-stone-400">
                                Each term cₙ·e^(2πint/T) is one spinning circle. Sum them all and the tip traces the original path.
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Interpretation key */}
            <div className="border-t border-stone-100 bg-stone-50/60">
                <div className="px-5 py-3">
                    <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-stone-400">
                        How to read it
                    </span>
                </div>
                <div className="grid divide-y divide-stone-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                    {interpretationRows.map((row) => (
                        <div key={row.symbol} className="px-5 py-4 sm:[&:nth-child(3)]:border-t sm:[&:nth-child(4)]:border-t border-stone-100">
                            <div className="mb-1 flex items-baseline gap-2">
                                <span className={`font-mono text-sm font-semibold ${row.symbolColor}`} style={serif}>
                                    {row.symbol}
                                </span>
                                <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-stone-400">
                                    {row.label}
                                </span>
                            </div>
                            <p className="text-[11px] leading-relaxed text-stone-500">{row.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ── DFT Coefficients Formula ──────────────────────────────────────────────────

export function DFTCoefficientsFormula({ defaultExpanded = false }: { defaultExpanded?: boolean } = {}) {
    const [expanded, setExpanded] = useState(defaultExpanded)

    return (
        <div className="my-10 overflow-hidden rounded-sm border border-stone-200 bg-white/80">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 border-b border-stone-100 px-5 py-3">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400 leading-relaxed">
                    Discrete Fourier Transform — computing the coefficients
                </span>
                <span className="font-mono text-[8px] text-stone-300 shrink-0">DFT</span>
            </div>

            {/* Main formula display */}
            <div className="px-6 py-8">
                <div className="flex items-center justify-center gap-3 overflow-x-auto pb-2">
                    {/* cₙ = */}
                    <span className="shrink-0 text-2xl text-[#A51C30]" style={serif}>
                        c<sub className="text-base text-[#A51C30]">n</sub>
                    </span>
                    <span className="shrink-0 text-xl text-stone-400">=</span>

                    {/* 1/N fraction */}
                    <span className="inline-flex shrink-0 flex-col items-center font-mono text-lg leading-none text-stone-600">
                        <span className="border-b border-stone-400 px-1 pb-0.5 text-base">1</span>
                        <span className="pt-0.5 text-base">N</span>
                    </span>

                    {/* · */}
                    <span className="shrink-0 text-xl text-stone-300">·</span>

                    {/* Summation */}
                    <span className="inline-flex shrink-0 flex-col items-center leading-none">
                        <span className="font-mono text-[10px] text-stone-500">N−1</span>
                        <span className="text-5xl font-light text-stone-400 leading-[0.85]">Σ</span>
                        <span className="font-mono text-[10px] text-stone-500">k = 0</span>
                    </span>

                    {/* z(k) */}
                    <span className="shrink-0 text-2xl text-stone-900" style={serif}>
                        z(k)
                    </span>

                    {/* · */}
                    <span className="shrink-0 text-xl text-stone-300">·</span>

                    {/* e^(-2πink/N) */}
                    <span className="shrink-0 text-2xl text-stone-700" style={serif}>
                        e
                        <sup className="font-mono text-sm text-stone-500">
                            −2πink/N
                        </sup>
                    </span>
                </div>

                {/* where z(k) = ... */}
                <div className="mt-4 flex justify-center">
                    <span className="font-mono text-[10px] text-stone-400">
                        where{" "}
                        <span className="text-stone-600">z(k) = x(k) + i·y(k)</span>{" "}
                        — the k-th path sample as a complex number
                    </span>
                </div>

                {/* Expand button */}
                <div className="mt-6 flex justify-center">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="inline-flex items-center gap-2 rounded-sm border border-stone-200 bg-stone-50 px-4 py-2 font-mono text-[9px] uppercase tracking-[0.15em] text-stone-500 transition-all hover:border-stone-300 hover:bg-white hover:text-stone-700"
                    >
                        <span
                            className="inline-block transition-transform duration-200"
                            style={{ transform: expanded ? "rotate(45deg)" : "rotate(0deg)" }}
                        >
                            +
                        </span>
                        {expanded ? "Collapse" : "See what each symbol means"}
                    </button>
                </div>

                {/* Expanded interpretation */}
                {expanded && (
                    <div className="mt-6 overflow-hidden rounded-sm border border-stone-100 bg-stone-50">
                        <div className="border-b border-stone-100 px-4 py-2">
                            <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-stone-400">
                                What the DFT is doing
                            </span>
                        </div>
                        <div className="px-5 py-4">
                            <p className="mb-4 text-[11px] leading-relaxed text-stone-500">
                                To find how much of frequency n is present in the path, the DFT multiplies each path point z(k)
                                by a rotating reference signal e^(−2πink/N) and sums over all N points.
                                When the reference frequency matches a frequency actually present in the path, the products add
                                constructively and the sum is large. When there&apos;s no match, the products cancel out and the sum
                                is near zero.
                            </p>
                            <p className="text-[11px] leading-relaxed text-stone-500">
                                This is done for every n from −N/2 to N/2, giving N complex numbers c₋N/2, …, c₀, …, cN/2.
                                The machine then draws them as spinning circles — larger |cₙ| means a larger, more prominent
                                circle. Sorting by magnitude puts the most important circles first.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Interpretation key */}
            <div className="border-t border-stone-100 bg-stone-50/60">
                <div className="px-5 py-3">
                    <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-stone-400">
                        Symbol key
                    </span>
                </div>
                <div className="grid divide-y divide-stone-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                    {dftInterpretation.map((row) => (
                        <div key={row.symbol} className="px-5 py-4 sm:[&:nth-child(3)]:border-t sm:[&:nth-child(4)]:border-t border-stone-100">
                            <div className="mb-1 flex items-baseline gap-2">
                                <span className={`font-mono text-sm font-semibold ${row.symbolColor}`} style={serif}>
                                    {row.symbol}
                                </span>
                                <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-stone-400">
                                    {row.label}
                                </span>
                            </div>
                            <p className="text-[11px] leading-relaxed text-stone-500">{row.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
