
"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { motion, useInView } from "framer-motion"
import {
    ArrowRight,
    Brain,
    Sparkles,
    Users,
    Zap,
    MessageSquare,
    Code2,
    Clock,
    Target,
    BookOpen,
    Monitor,
    Search,
    PhoneCall,
    CheckCircle2,
    Loader2,
    Send,
} from "lucide-react"
import { personalInfo } from "@/lib/data"
import { blogPosts } from "@/lib/consulting-blog"

// ── Shared style constants ───────────────────────────────────────────────────
const serif = { fontFamily: "var(--font-playfair), Georgia, 'Times New Roman', serif" }

// ── Noise background ─────────────────────────────────────────────────────────
function NoiseLayer() {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 z-0"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
                backgroundRepeat: "repeat",
                backgroundSize: "300px 300px",
                opacity: 0.025,
            }}
        />
    )
}

// ── Animated section wrapper ─────────────────────────────────────────────────
function EditorialSection({
    id, label, children, className = "", wide = false,
}: {
    id: string; label?: string; children: React.ReactNode; className?: string; wide?: boolean
}) {
    const ref = useRef(null)
    const inView = useInView(ref, { once: true, margin: "-80px" })
    return (
        <motion.section
            id={id} ref={ref}
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className={`relative z-10 mx-auto px-6 py-12 md:py-20 ${wide ? "max-w-6xl" : "max-w-4xl"} ${className}`}
        >
            {label && (
                <div className="mb-10 flex items-center gap-4">
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.25em] text-stone-400">{label}</span>
                    <div className="h-px flex-1 bg-stone-200" />
                </div>
            )}
            {children}
        </motion.section>
    )
}

function Divider() { return <div className="h-px w-full bg-stone-200" /> }

// ── Chapter nav row ──────────────────────────────────────────────────────────
const chapters = [
    { id: "the-problem", label: "The Problem" },
    { id: "services", label: "Services" },
    { id: "how-it-works", label: "How It Works" },
    { id: "insights", label: "Insights" },
    { id: "book", label: "Book a Call" },
]

function ChapterRow() {
    return (
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {chapters.map((ch, i) => (
                <button key={ch.id}
                    onClick={() => document.getElementById(ch.id)?.scrollIntoView({ behavior: "smooth" })}
                    className="group flex items-center gap-2 text-xs text-stone-500 transition-colors hover:text-[#A51C30]"
                >
                    <span className="font-mono text-[10px] text-stone-300">{String(i + 1).padStart(2, "0")}</span>
                    <span className="border-b border-transparent group-hover:border-[#A51C30]/55 transition-all">{ch.label}</span>
                </button>
            ))}
        </div>
    )
}

// ── Services tabs ────────────────────────────────────────────────────────────
const serviceTabs = [
    {
        id: "training", tab: "AI Training", number: "01",
        price: "$200 / hr", priceNote: "per session",
        headline: "From Curious to Capable",
        body: "Hands-on sessions tailored to your background and goals. We start where you are and build real, lasting proficiency — not just familiarity. Every session is customized; nothing is off-the-shelf.",
        reveals: "After a few sessions, you'll have a growing library of use cases that actually work for you, sharper judgment about when AI helps (and when it doesn't), and workflows you'll keep using long after we're done.",
        items: [
            { icon: MessageSquare, label: "ChatGPT", desc: "Projects, GPTs, advanced prompting" },
            { icon: Brain, label: "Claude", desc: "Document analysis, coding, reasoning" },
            { icon: Search, label: "Perplexity", desc: "Agentic web research & automation" },
            { icon: Code2, label: "AI Coding", desc: "Cursor, Windsurf, GitHub Copilot" },
        ],
    },
    {
        id: "corporate", tab: "Corporate Adoption", number: "02",
        price: "Package / Retainer", priceNote: "pricing varies",
        headline: "Strategic, Measurable, Gradual",
        body: "AI adoption fails when it's rushed. I help organizations adopt AI the right way — mapping real use cases to the right tools, building team capability, and tracking what actually delivers ROI.",
        reveals: "A phased adoption roadmap with clear success metrics, team workshops tailored by function, and an honest vendor assessment — so you're not locked into the wrong stack.",
        items: [
            { icon: Target, label: "Use Case Discovery", desc: "Identify highest-leverage opportunities" },
            { icon: Sparkles, label: "Adoption Roadmap", desc: "Phased rollout strategy across teams" },
            { icon: Users, label: "Team Enablement", desc: "Workshops and hands-on training" },
            { icon: Monitor, label: "Vendor Assessment", desc: "Evaluate platforms and tools for fit" },
        ],
    },
    {
        id: "custom", tab: "Custom AI Builds", number: "03",
        price: "Project-Based", priceNote: "scoped per project",
        headline: "When Off-the-Shelf Isn't Enough",
        body: "Sometimes the right AI solution doesn't exist yet. I build custom agents, personal tools, and RAG systems tailored to your specific data and workflow — scoped for your actual needs, not enterprise-scale complexity.",
        reveals: "A working custom tool built around your specific data and workflow — documented, deployed, and yours to own. From a weekend prototype to a polished personal tool.",
        items: [
            { icon: Zap, label: "AI Agents", desc: "Automated workflows and pipelines" },
            { icon: Code2, label: "Custom Apps", desc: "Dashboards, internal tools, prototypes" },
            { icon: Brain, label: "RAG Systems", desc: "Document-aware AI over your own data" },
            { icon: Monitor, label: "Integrations", desc: "Connect AI to your existing stack" },
        ],
    },
]

function ServicesTabs() {
    const [active, setActive] = useState(serviceTabs[0].id)
    const tab = serviceTabs.find((t) => t.id === active)!
    return (
        <div className="mt-0">
            {/* ── 3-service at-a-glance cards ── */}
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-2">
                {serviceTabs.map((s) => (
                    <button
                        key={s.id}
                        onClick={() => setActive(s.id)}
                        className={`rounded-sm border p-3 text-left transition-all ${active === s.id
                            ? "border-[#A51C30]/25 bg-[#A51C30]/5"
                            : "border-stone-200 bg-white/60 hover:border-stone-300 hover:bg-white/80"
                            }`}
                    >
                        <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-400">{s.number}</div>
                        <div className="mt-1 text-xs font-semibold text-stone-800">{s.tab}</div>
                        <div className="mt-0.5 font-mono text-[10px] font-bold text-[#A51C30]">{s.price}</div>
                    </button>
                ))}
            </div>

            {/* ── Tab selector ── */}
            <div className="flex gap-1 border-b border-stone-200">
                {serviceTabs.map((s) => (
                    <button key={s.id} onClick={() => setActive(s.id)}
                        className={`relative px-4 py-2.5 text-sm transition-colors ${active === s.id ? "text-stone-900" : "text-stone-400 hover:text-stone-600"}`}
                    >
                        <span className="mr-1.5 font-mono text-[10px] text-stone-300">{s.number}</span>
                        {s.tab}
                        {active === s.id && (
                            <motion.div layoutId="service-underline"
                                className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#A51C30]"
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                        )}
                    </button>
                ))}
            </div>
            <motion.div key={tab.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }} className="mt-6 grid gap-6 md:grid-cols-5"
            >
                <div className="md:col-span-3 space-y-5">
                    <div className="flex flex-wrap items-baseline gap-3">
                        <h3 className="text-xl font-bold text-stone-800" style={serif}>{tab.headline}</h3>
                        <span className="font-mono text-sm font-bold text-[#A51C30]">{tab.price}</span>
                        <span className="font-mono text-[10px] uppercase text-stone-400">{tab.priceNote}</span>
                    </div>
                    <p className="text-sm leading-relaxed text-stone-600">{tab.body}</p>
                    <div className="grid grid-cols-2 gap-2.5">
                        {tab.items.map((item) => (
                            <div key={item.label} className="flex items-start gap-2.5 rounded-sm border border-stone-200 bg-white/60 px-3 py-2.5">
                                <item.icon className="mt-[1px] h-3.5 w-3.5 shrink-0 text-stone-400" />
                                <div>
                                    <p className="text-xs font-semibold text-stone-700">{item.label}</p>
                                    <p className="text-[11px] leading-snug text-stone-400">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Link href="/contact"
                        className="inline-flex items-center gap-2 rounded-sm bg-stone-900 px-4 py-2 text-sm text-white transition-colors hover:bg-stone-700"
                    >
                        Get started <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
                <div className="md:col-span-2">
                    <div className="h-full rounded-sm border border-[#A51C30]/12 bg-[#A51C30]/5 p-5">
                        <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-[#A51C30]">What to expect</div>
                        <p className="text-sm leading-relaxed text-[#7a0e1e]">{tab.reveals}</p>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

// ── Data ─────────────────────────────────────────────────────────────────────
const steps = [
    { num: "01", title: "Initial Call", desc: "We discuss your goals, current workflows, and discover the highest-leverage AI use cases. Free, no commitment.", optional: false, icon: PhoneCall },
    { num: "02", title: "Phase 1 — Foundations", desc: "For those new to AI. We build foundational skills so you can engage confidently with the tools before moving to advanced use cases.", optional: true, icon: BookOpen },
    { num: "03", title: "Phase 2 — Advanced Use Cases", desc: "We work through increasingly complex, personalized use cases using the best platforms for your needs. This is where compounding ROI begins.", optional: false, icon: Sparkles },
    { num: "04", title: "Custom Build", desc: "If a critical use case isn't AI-ready off-the-shelf, I build a custom application to bridge the gap — from agent to full internal tool.", optional: true, icon: Code2 },
]


const proofStats = [
    { value: "Harvard", label: "Statistics & CS", note: "Class of 2025, Honors" },
    { value: "Cresset", label: "AI Engineer", note: "Enterprise adoption" },
    { value: "Coach", label: "Curious Cardinals", note: "Executive AI coaching" },
]

type IntakeStatus = "idle" | "submitting" | "success" | "error"

const intakeInitial = {
    name: "", email: "", company: "", engagement: "", timeline: "", message: "", "bot-field": "",
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function ConsultingPage() {
    const [intake, setIntake] = useState(intakeInitial)
    const [intakeStatus, setIntakeStatus] = useState<IntakeStatus>("idle")

    const handleIntakeChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => setIntake((prev) => ({ ...prev, [e.target.name]: e.target.value }))

    const handleIntake = async (e: React.FormEvent) => {
        e.preventDefault()
        if (intake["bot-field"]) return
        setIntakeStatus("submitting")
        try {
            await fetch("/netlify-forms.html", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({ "form-name": "consulting-intake", ...intake }).toString(),
            })
            setIntakeStatus("success")
            setIntake(intakeInitial)
        } catch {
            setIntakeStatus("error")
        }
    }

    const inputLight = "w-full border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 placeholder:text-stone-300 outline-none focus:border-stone-500 transition-colors"
    const labelLight = "block font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400 mb-1.5"

    return (
        <main className="relative min-h-screen bg-[#f9f8f6] text-stone-900">
            <NoiseLayer />

            {/* ── HERO ──────────────────────────────────────────────── */}
            <section className="relative z-10 mx-auto flex min-h-[88vh] max-w-6xl flex-col justify-center px-6 py-16 sm:py-24">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
                    className="mb-8 font-mono text-[10px] uppercase tracking-[0.3em] text-stone-400"
                >
                    AI Consulting &amp; Training
                </motion.div>

                <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                            className="text-4xl font-bold leading-[1.06] tracking-tight text-stone-900 sm:text-5xl lg:text-7xl"
                            style={serif}
                        >
                            Adopting AI.
                            <br /><span className="text-[#A51C30]">Impact Without</span>
                            <br />Fatigue.
                        </motion.h1>
                        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.3 }}
                            className="mt-6 max-w-md text-base leading-relaxed text-stone-600"
                        >
                            AI adoption is hard. Too many tools, too much hype, too little guidance. I help individuals and organizations cut through the noise — building real skills and measurable ROI, one use case at a time.
                        </motion.p>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.5 }}
                            className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3"
                        >
                            <Link href="/contact"
                                className="flex items-center gap-2 rounded-sm bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-700"
                            >
                                Book a Free Intro Call <ArrowRight className="h-4 w-4" />
                            </Link>
                            <a href={`mailto:${personalInfo.email}`}
                                className="flex items-center gap-2 rounded-sm border border-stone-300 px-5 py-2.5 text-sm text-stone-600 transition-colors hover:border-stone-500 hover:text-stone-800"
                            >
                                Send an Email
                            </a>
                        </motion.div>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.65 }}
                            className="mt-5 flex items-center gap-1.5 font-mono text-[10px] text-stone-400"
                        >
                            <Clock className="h-3 w-3" /> Free 30-min intro call — no commitment, no pressure
                        </motion.div>
                    </div>

                    {/* Proof stats */}
                    <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7, delay: 0.45 }} className="flex items-center"
                    >
                        <div className="w-full rounded-sm border border-stone-200 bg-white/70 p-6">
                            <div className="mb-4 font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400">Background</div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {proofStats.map((s) => (
                                    <div key={s.label} className="rounded-sm border border-stone-100 bg-stone-50 px-3 py-3">
                                        <div className="text-lg font-bold text-stone-800" style={serif}>{s.value}</div>
                                        <div className="text-xs font-medium text-stone-600">{s.label}</div>
                                        <div className="mt-0.5 font-mono text-[9px] text-stone-400">{s.note}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Chapter nav row */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.85 }} className="mt-16">
                    <Divider />
                    <div className="py-5"><ChapterRow /></div>
                    <Divider />
                </motion.div>
            </section>

            {/* ── 01 THE PROBLEM ────────────────────────────────────── */}
            <EditorialSection id="the-problem" label="01 — The Problem" wide>
                <div className="grid gap-12 md:grid-cols-2">
                    <div>
                        <h2 className="mb-5 text-3xl font-bold leading-snug text-stone-900 sm:text-4xl" style={serif}>
                            AI Is Transformative.<br />Adoption Is Exhausting.
                        </h2>
                        <div className="space-y-4 text-base leading-relaxed text-stone-600">
                            <p>There are too many resources, too many platforms, and too much conflicting advice. Most people waste weeks trying random tools without a structured approach.</p>
                            <p>AI is frequently misapplied — used on the wrong problems, in the wrong ways, with no clear measure of whether it's actually helping.</p>
                            <p>The solution isn't doing more. It's adopting <em>gradually</em>, <em>strategically</em>, and with a clear log of what's working for you.</p>
                        </div>
                    </div>
                    <div>
                        <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">The Challenge Differs</div>
                        <p className="mb-6 text-base font-semibold text-stone-800" style={serif}>The right starting point depends on who you are.</p>
                        <div className="space-y-4">
                            {[
                                {
                                    label: "For Individuals",
                                    text: "Too many tools, no clear structure. Most people spend more time trying AI than building real habits that stick.",
                                },
                                {
                                    label: "For Organizations",
                                    text: "AI mandates without roadmaps. Teams adopt reluctantly, use cases stay shallow, and ROI remains invisible.",
                                },
                                {
                                    label: "For Custom Needs",
                                    text: "Off-the-shelf tools don't fit your workflow. You need something built around your specific data and process.",
                                },
                            ].map((item) => (
                                <div key={item.label} className="border-l-2 border-stone-200 pl-4 space-y-0.5">
                                    <p className="text-sm font-semibold text-stone-700">{item.label}</p>
                                    <p className="text-sm leading-relaxed text-stone-500">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </EditorialSection>

            <Divider />

            {/* ── 02 SERVICES ───────────────────────────────────────── */}
            <EditorialSection id="services" label="02 — Services" wide>
                <div className="grid gap-10 md:grid-cols-[1fr_2.2fr]">
                    <div>
                        <h2 className="mb-4 text-3xl font-bold text-stone-900 sm:text-4xl" style={serif}>What I Offer</h2>
                        <p className="text-sm leading-relaxed text-stone-500">
                            Whether you're an executive learning the basics or a company building AI infrastructure — there's an engagement that fits.
                        </p>
                    </div>
                    <ServicesTabs />
                </div>
            </EditorialSection>

            <Divider />

            {/* ── 03 HOW IT WORKS ───────────────────────────────────── */}
            <EditorialSection id="how-it-works" label="03 — How It Works" wide>
                <div className="grid gap-10 md:grid-cols-[1fr_2.2fr]">
                    <div>
                        <h2 className="mb-4 text-3xl font-bold text-stone-900 sm:text-4xl" style={serif}>Engagement Model</h2>
                        <p className="text-sm leading-relaxed text-stone-500">
                            A flexible, phased approach designed to meet you where you are. Most engagements start with a free 30-minute intro call.
                        </p>
                    </div>
                    <div className="divide-y divide-stone-200 rounded-sm border border-stone-200 bg-white/50">
                        {steps.map((step) => (
                            <div key={step.num} className="flex gap-5 px-5 py-5">
                                <div className="flex shrink-0 flex-col items-center gap-1.5 pt-0.5">
                                    <span className="font-mono text-[10px] text-[#A51C30]">{step.num}</span>
                                    <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-stone-200 bg-stone-50">
                                        <step.icon className="h-3.5 w-3.5 text-stone-400" />
                                    </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-semibold text-stone-800">{step.title}</h4>
                                        {step.optional && (
                                            <span className="rounded-sm bg-stone-100 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-stone-400">Optional</span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-sm leading-relaxed text-stone-500">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </EditorialSection>

            <Divider />

            {/* ── 04 INSIGHTS ───────────────────────────────────────── */}
            <EditorialSection id="insights" label="04 — Insights" wide>
                <div className="grid gap-10 md:grid-cols-[1fr_2.2fr]">
                    <div>
                        <h2 className="mb-4 text-3xl font-bold text-stone-900 sm:text-4xl" style={serif}>From the Blog</h2>
                        <p className="text-sm leading-relaxed text-stone-500">
                            Practical takes on AI tools and workflows — written for people actually using them, not just evaluating them.
                        </p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        {blogPosts.map((post) => (
                            <Link
                                key={post.slug}
                                href={`/consulting/blog/${post.slug}`}
                                className="group flex flex-col justify-between rounded-sm border border-stone-200 bg-white/70 p-5 transition-all hover:border-stone-300 hover:shadow-sm"
                            >
                                <div>
                                    <div className="mb-3 flex flex-wrap gap-1.5">
                                        {post.tags.slice(0, 2).map((tag) => (
                                            <span
                                                key={tag}
                                                className="rounded-sm bg-stone-100 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-stone-500"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                    <h3
                                        className="mb-2 text-sm font-bold leading-snug text-stone-800 group-hover:text-[#A51C30] transition-colors"
                                        style={serif}
                                    >
                                        {post.title}
                                    </h3>
                                    <p className="text-[11px] leading-relaxed text-stone-500 line-clamp-3">
                                        {post.excerpt}
                                    </p>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-stone-400">
                                        {post.readTime}
                                    </div>
                                    <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#A51C30] transition-transform group-hover:translate-x-0.5">
                                        Read →
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </EditorialSection>

            <Divider />

            {/* ── 05 BOOK A CALL ────────────────────────────────────── */}
            <section id="book" className="relative z-10 w-full bg-[#f9f8f6] px-6 py-12 md:py-20">
                <div className="mx-auto max-w-5xl">
                    {/* Section label */}
                    <div className="mb-10 flex items-center gap-4">
                        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.25em] text-stone-400">05 — Book a Call</span>
                        <div className="h-px flex-1 bg-stone-200" />
                    </div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        className="grid gap-14 lg:grid-cols-[1fr_480px]"
                    >
                        {/* Left: copy */}
                        <div className="flex flex-col justify-center">
                            <div className="mb-6 inline-flex w-fit items-center gap-2 border border-stone-200 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">
                                <Clock className="h-3 w-3" /> Free 30-min intro call
                            </div>
                            <h2 className="mb-5 text-4xl font-bold leading-tight text-stone-900 sm:text-5xl" style={serif}>
                                Ready to get started?
                            </h2>
                            <p className="mb-8 max-w-md text-base leading-relaxed text-stone-500">
                                Tell me a little about what you're working on. I'll follow up to schedule a free intro call — no commitment, no pressure.
                            </p>
                            <a
                                href={`mailto:${personalInfo.email}`}
                                className="self-start font-mono text-[11px] uppercase tracking-[0.2em] text-stone-400 hover:text-stone-700 transition-colors"
                            >
                                {personalInfo.email}
                            </a>
                        </div>

                        {/* Right: form */}
                        <div className="border border-stone-200 bg-white p-7">
                            {intakeStatus === "success" ? (
                                <div className="flex flex-col items-center justify-center gap-5 py-12 text-center">
                                    <CheckCircle2 className="h-10 w-10 text-[#A51C30]" />
                                    <div>
                                        <p className="text-base font-semibold text-stone-900" style={serif}>Request received.</p>
                                        <p className="mt-1 text-sm text-stone-500">I'll be in touch soon.</p>
                                    </div>
                                    <button
                                        onClick={() => setIntakeStatus("idle")}
                                        className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400 hover:text-stone-700 transition-colors border border-stone-200 px-4 py-2"
                                    >
                                        Send another
                                    </button>
                                </div>
                            ) : (
                                <form
                                    onSubmit={handleIntake}
                                    noValidate
                                    data-netlify="true"
                                    name="consulting-intake"
                                    className="space-y-4"
                                >
                                    {/* Honeypot */}
                                    <input
                                        type="text"
                                        name="bot-field"
                                        value={intake["bot-field"]}
                                        onChange={handleIntakeChange}
                                        tabIndex={-1}
                                        aria-hidden="true"
                                        style={{ position: "absolute", left: "-9999px" }}
                                    />
                                    <input type="hidden" name="form-name" value="consulting-intake" />

                                    {/* Name + Email */}
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelLight}>Name <span className="text-[#A51C30]">*</span></label>
                                            <input
                                                required
                                                type="text"
                                                name="name"
                                                placeholder="Jane Smith"
                                                value={intake.name}
                                                onChange={handleIntakeChange}
                                                className={inputLight}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelLight}>Email <span className="text-[#A51C30]">*</span></label>
                                            <input
                                                required
                                                type="email"
                                                name="email"
                                                placeholder="jane@company.com"
                                                value={intake.email}
                                                onChange={handleIntakeChange}
                                                className={inputLight}
                                            />
                                        </div>
                                    </div>

                                    {/* Company */}
                                    <div>
                                        <label className={labelLight}>Company / Organization</label>
                                        <input
                                            type="text"
                                            name="company"
                                            placeholder="Acme Corp"
                                            value={intake.company}
                                            onChange={handleIntakeChange}
                                            className={inputLight}
                                        />
                                    </div>

                                    {/* Engagement + Timeline */}
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelLight}>What are you looking for? <span className="text-[#A51C30]">*</span></label>
                                            <select
                                                required
                                                name="engagement"
                                                value={intake.engagement}
                                                onChange={handleIntakeChange}
                                                className={`${inputLight} bg-white`}
                                            >
                                                <option value="" disabled>Select…</option>
                                                <option value="AI Training">AI Training</option>
                                                <option value="Corporate Adoption">Corporate Adoption</option>
                                                <option value="Custom AI Build">Custom AI Build</option>
                                                <option value="Not sure yet">Not sure yet</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelLight}>Timeline</label>
                                            <select
                                                name="timeline"
                                                value={intake.timeline}
                                                onChange={handleIntakeChange}
                                                className={`${inputLight} bg-white`}
                                            >
                                                <option value="" disabled>Select…</option>
                                                <option value="ASAP">ASAP</option>
                                                <option value="1–3 months">1–3 months</option>
                                                <option value="3–6 months">3–6 months</option>
                                                <option value="6+ months">6+ months</option>
                                                <option value="Just exploring">Just exploring</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Message */}
                                    <div>
                                        <label className={labelLight}>Tell me more <span className="text-[#A51C30]">*</span></label>
                                        <textarea
                                            required
                                            name="message"
                                            rows={4}
                                            placeholder="What are you working on? What's the biggest bottleneck AI could help with?"
                                            value={intake.message}
                                            onChange={handleIntakeChange}
                                            className={`${inputLight} resize-none`}
                                        />
                                    </div>

                                    {intakeStatus === "error" && (
                                        <p className="font-mono text-[11px] text-red-400">
                                            Something went wrong — please email me directly at {personalInfo.email}
                                        </p>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={intakeStatus === "submitting"}
                                        className="w-full bg-[#A51C30] hover:bg-[#8a0e20] text-white text-sm font-medium py-3 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {intakeStatus === "submitting" ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <><Send className="h-4 w-4" /> Send Request</>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </div>
            </section>
        </main>
    )
}
