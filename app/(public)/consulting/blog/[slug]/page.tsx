
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Clock, Calendar } from "lucide-react"
import { getBlogPost, blogPosts, type ContentBlock } from "@/lib/consulting-blog"

const serif = { fontFamily: "var(--font-playfair), Georgia, 'Times New Roman', serif" }

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

// ── Diagrams ─────────────────────────────────────────────────────────────────

function DiagramChatGPT() {
    return (
        <div className="my-10 overflow-hidden rounded-sm border border-stone-200 bg-white/80">
            <div className="border-b border-stone-100 px-5 py-3">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400">
                    Three modes compared
                </span>
            </div>
            <div className="grid divide-y divide-stone-100 sm:divide-x sm:divide-y-0 sm:grid-cols-3">

                {/* ── Panel 01: Regular Chats ── */}
                <div className="p-5">
                    <div className="mb-1 font-mono text-[8px] uppercase tracking-[0.2em] text-stone-400">01</div>
                    <div className="mb-4 text-xs font-bold text-stone-700">Regular Chats</div>
                    <div className="space-y-1.5">
                        <div className="rounded-sm border border-stone-200 bg-stone-50 px-3 py-2">
                            <div className="text-[10px] font-semibold text-stone-700">User sends a message</div>
                            <div className="text-[9px] text-stone-400">Any topic, any session</div>
                        </div>
                        <div className="py-1 text-center text-sm font-bold text-stone-500">↓</div>
                        <div className="rounded-sm border border-stone-200 bg-stone-50 px-3 py-2">
                            <div className="text-[10px] font-semibold text-stone-400">New chat (cold start)</div>
                            <div className="text-[9px] text-stone-400">No memory of prior work</div>
                        </div>
                        <div className="py-1 text-center text-sm font-bold text-stone-500">↓</div>
                        <div className="rounded-sm border border-stone-200 bg-stone-50 px-3 py-2">
                            <div className="text-[10px] font-semibold text-stone-400">Generic response</div>
                            <div className="text-[9px] text-stone-400">Not tailored to your context</div>
                        </div>
                        <div className="py-1 text-center text-sm font-bold text-stone-500">↓</div>
                        <div className="rounded-sm border border-stone-200 bg-stone-100 px-3 py-2 opacity-60">
                            <div className="text-[10px] font-semibold text-stone-500">Next session — repeat</div>
                            <div className="text-[9px] text-stone-400">Re-explain from scratch</div>
                        </div>
                    </div>
                    <div className="mt-4 rounded-sm bg-stone-100 px-3 py-2">
                        <div className="text-[9px] font-semibold text-stone-500">Result</div>
                        <div className="text-[9px] text-stone-400">Disposable. No continuity.</div>
                    </div>
                </div>

                {/* ── Panel 02: Projects ── */}
                <div className="p-5">
                    <div className="mb-1 font-mono text-[8px] uppercase tracking-[0.2em] text-stone-400">02</div>
                    <div className="mb-4 text-xs font-bold text-stone-700">Projects</div>
                    <div className="space-y-1.5">
                        <div className="rounded-sm border border-stone-300 bg-white px-3 py-2.5">
                            <div className="mb-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-stone-500">
                                Project workspace
                            </div>
                            {["Persistent memory", "Uploaded files", "Custom instructions", "Session history"].map((item) => (
                                <div key={item} className="flex items-center gap-1.5 py-0.5">
                                    <div className="h-[3px] w-[3px] shrink-0 rounded-full bg-stone-400" />
                                    <span className="text-[10px] text-stone-600">{item}</span>
                                </div>
                            ))}
                        </div>
                        <div className="py-1 text-center text-sm font-bold text-stone-500">↓</div>
                        <div className="rounded-sm border border-stone-200 bg-stone-50 px-3 py-2">
                            <div className="text-[10px] font-semibold text-stone-700">Context-aware response</div>
                            <div className="text-[9px] text-stone-400">Knows your files & history</div>
                        </div>
                        <div className="py-1 text-center text-sm font-bold text-stone-500">↓</div>
                        <div className="rounded-sm border border-stone-200 bg-stone-50 px-3 py-2">
                            <div className="text-[10px] font-semibold text-stone-700">Next session: continues</div>
                            <div className="text-[9px] text-stone-400">Builds on prior work</div>
                        </div>
                    </div>
                    <div className="mt-4 rounded-sm bg-stone-100 px-3 py-2">
                        <div className="text-[9px] font-semibold text-stone-600">Result</div>
                        <div className="text-[9px] text-stone-500">Persistent context. No cold starts.</div>
                    </div>
                </div>

                {/* ── Panel 03: Custom GPTs ── */}
                <div className="bg-[#A51C30]/[0.03] p-5">
                    <div className="mb-1 font-mono text-[8px] uppercase tracking-[0.2em] text-[#A51C30]">03</div>
                    <div className="mb-4 text-xs font-bold text-stone-700">Custom GPTs</div>
                    <div className="space-y-1.5">
                        <div className="rounded-sm border border-[#A51C30]/20 bg-white/80 px-3 py-2.5">
                            <div className="mb-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-[#A51C30]">
                                GPT configuration
                            </div>
                            {["Role & instructions", "Knowledge files", "Web browsing", "Code execution"].map((item) => (
                                <div key={item} className="flex items-center gap-1.5 py-0.5">
                                    <div className="h-[3px] w-[3px] shrink-0 rounded-full bg-[#A51C30]/50" />
                                    <span className="text-[10px] text-stone-600">{item}</span>
                                </div>
                            ))}
                        </div>
                        <div className="py-1 text-center text-sm font-bold text-[#A51C30]/60">↓</div>
                        <div className="rounded-sm border border-[#A51C30]/15 bg-white/70 px-3 py-2">
                            <div className="text-[10px] font-semibold text-stone-700">Specialized AI expert</div>
                            <div className="text-[9px] text-stone-400">Behaves as a focused role</div>
                        </div>
                        <div className="py-1 text-center text-sm font-bold text-[#A51C30]/60">↓</div>
                        <div className="rounded-sm border border-[#A51C30]/15 bg-white/70 px-3 py-2">
                            <div className="text-[10px] font-semibold text-stone-700">Shareable & reusable</div>
                            <div className="text-[9px] text-stone-400">Build once, use always</div>
                        </div>
                    </div>
                    <div className="mt-4 rounded-sm bg-[#A51C30]/10 px-3 py-2">
                        <div className="text-[9px] font-semibold text-[#A51C30]">Result</div>
                        <div className="text-[9px] text-[#A51C30]/70">Specialized assistant. Zero setup each time.</div>
                    </div>
                </div>

            </div>
        </div>
    )
}

function DiagramPerplexity() {
    const models = [
        { name: "Claude Opus 4.6", role: "Reasoning & Coding" },
        { name: "Gemini", role: "Deep Research" },
        { name: "GPT-5.2", role: "Long-Context" },
        { name: "Grok", role: "Speed Tasks" },
        { name: "Nano Banana", role: "Image Gen" },
        { name: "Veo 3.1", role: "Video Gen" },
    ]
    const connectors = ["Browser", "Filesystem", "Gmail", "GitHub", "Slack", "Notion", "Salesforce", "Snowflake", "+ 392 more"]
    const outputs = ["Research Reports", "Spreadsheets", "Websites", "Code & Deploys", "Emails", "Slide Decks"]

    return (
        <div className="my-10 overflow-hidden rounded-sm border border-stone-200 bg-white/80">
            <div className="border-b border-stone-100 px-5 py-3">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400">
                    Execution pipeline
                </span>
            </div>
            <div className="space-y-px">
                {/* Input */}
                <div className="bg-stone-50 px-5 py-4 text-center">
                    <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-400">Input</div>
                    <div className="mt-1 text-sm font-semibold text-stone-800" style={serif}>
                        Natural Language Goal
                    </div>
                    <div className="mt-0.5 text-[11px] text-stone-500">
                        One instruction. Plain language. Any complexity.
                    </div>
                </div>

                <div className="flex justify-center bg-stone-50 py-0.5 text-base font-bold text-stone-500">↓</div>

                {/* Decomposition */}
                <div className="bg-stone-50 px-5 py-4 text-center">
                    <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-400">
                        Perplexity Computer
                    </div>
                    <div className="mt-1 text-sm font-semibold text-stone-800" style={serif}>
                        Task Decomposition
                    </div>
                    <div className="mt-0.5 text-[11px] text-stone-500">
                        Goal → ordered subtasks → subtasks routed to best-fit model → parallel execution
                    </div>
                </div>

                <div className="flex justify-center bg-stone-50 py-0.5 text-base font-bold text-stone-500">↓</div>

                {/* Multi-model orchestration */}
                <div className="bg-[#A51C30]/[0.04] px-5 py-5">
                    <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.15em] text-[#A51C30]">
                        Multi-Model Orchestration — 19 Models Total
                    </div>
                    <div className="mb-3 text-[10px] text-stone-500">
                        6 publicly named · 13 undisclosed · roster updates as better models emerge
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                        {models.map((m) => (
                            <div
                                key={m.name}
                                className="rounded-sm border border-[#A51C30]/15 bg-white/80 px-2.5 py-2"
                            >
                                <div className="text-[10px] font-semibold text-stone-800">{m.name}</div>
                                <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-stone-400">
                                    {m.role}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-center bg-[#A51C30]/[0.02] py-0.5 text-base font-bold text-stone-500">↓</div>

                {/* Connectors */}
                <div className="bg-stone-50 px-5 py-4">
                    <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.15em] text-stone-400">
                        400+ Connectors & Cloud Tools
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {connectors.map((c) => (
                            <span
                                key={c}
                                className="rounded-sm border border-stone-200 bg-white px-2 py-0.5 font-mono text-[9px] text-stone-600"
                            >
                                {c}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="flex justify-center bg-stone-50 py-0.5 text-base font-bold text-stone-500">↓</div>

                {/* Human gate */}
                <div className="border-y border-stone-200 bg-stone-100 px-5 py-3 text-center">
                    <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-500">
                        Human Approval Gate
                    </div>
                    <div className="mt-0.5 text-[11px] text-stone-500">
                        Pauses before irreversible actions — sending emails, pushing code, publishing sites
                    </div>
                </div>

                <div className="flex justify-center bg-stone-50 py-0.5 text-base font-bold text-stone-500">↓</div>

                {/* Outputs */}
                <div className="bg-stone-50 px-5 py-4">
                    <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.15em] text-stone-400">
                        Finished Output
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {outputs.map((o) => (
                            <span
                                key={o}
                                className="rounded-sm bg-stone-900 px-2 py-0.5 font-mono text-[9px] text-stone-200"
                            >
                                {o}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function renderDiagram(id: string, index: number) {
    if (id === "chatgpt-architecture") return <DiagramChatGPT key={index} />
    if (id === "perplexity-architecture") return <DiagramPerplexity key={index} />
    return null
}

// ── Content renderer ──────────────────────────────────────────────────────────

function renderBlock(block: ContentBlock, index: number) {
    switch (block.type) {
        case "heading":
            return (
                <h2
                    key={index}
                    className="mb-4 mt-12 text-2xl font-bold leading-snug text-stone-900"
                    style={serif}
                >
                    {block.text}
                </h2>
            )
        case "paragraph":
            return (
                <p key={index} className="mb-5 text-base leading-relaxed text-stone-600">
                    {block.text}
                </p>
            )
        case "list":
            return (
                <div key={index} className="mb-6">
                    {block.heading && (
                        <p className="mb-3 text-sm font-semibold text-stone-700">{block.heading}</p>
                    )}
                    <ul className="space-y-2.5">
                        {block.items.map((item, i) => (
                            <li key={i} className="flex gap-3 text-sm leading-relaxed text-stone-600">
                                <span className="mt-[9px] h-[4px] w-[4px] shrink-0 rounded-full bg-[#A51C30]" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )
        case "callout":
            return (
                <div
                    key={index}
                    className="my-8 rounded-sm border-l-2 border-[#A51C30] bg-[#A51C30]/5 px-6 py-5"
                >
                    <p className="text-sm italic leading-relaxed text-[#7a0e1e]">{block.text}</p>
                </div>
            )
        case "diagram":
            return renderDiagram(block.id, index)
        default:
            return null
    }
}

// ── Static params & metadata ──────────────────────────────────────────────────

export async function generateStaticParams() {
    return blogPosts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const post = getBlogPost(slug)
    if (!post) return {}
    return {
        title: post.title,
        description: post.excerpt,
    }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const post = getBlogPost(slug)
    if (!post) notFound()

    return (
        <main className="relative min-h-screen bg-[#f9f8f6] text-stone-900">
            <NoiseLayer />

            <article className="relative z-10 mx-auto max-w-2xl px-6 pb-24 pt-16">
                {/* Back link */}
                <Link
                    href="/consulting"
                    className="mb-14 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400 transition-colors hover:text-stone-700"
                >
                    <ArrowLeft className="h-3 w-3" /> Back to Consulting
                </Link>

                {/* Header */}
                <header className="mb-12">
                    <div className="mb-5 flex flex-wrap gap-2">
                        {post.tags.map((tag) => (
                            <span
                                key={tag}
                                className="rounded-sm border border-stone-200 bg-stone-50 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-stone-500"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>

                    <h1
                        className="mb-6 text-4xl font-bold leading-tight text-stone-900 sm:text-5xl"
                        style={serif}
                    >
                        {post.title}
                    </h1>

                    <p className="mb-6 text-base leading-relaxed text-stone-500">{post.excerpt}</p>

                    <div className="flex items-center gap-5 font-mono text-[10px] uppercase tracking-[0.15em] text-stone-400">
                        <span className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" /> {post.date}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3" /> {post.readTime}
                        </span>
                    </div>

                    <div className="mt-8 h-px bg-stone-200" />
                </header>

                {/* Content */}
                <div>{post.content.map((block, i) => renderBlock(block, i))}</div>

                {/* Divider */}
                <div className="my-14 h-px bg-stone-200" />

                {/* CTA */}
                <div className="rounded-sm border border-stone-200 bg-white/70 p-8">
                    <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400">
                        Want to go deeper?
                    </div>
                    <p className="mb-5 text-xl font-semibold leading-snug text-stone-800" style={serif}>
                        I help individuals and teams build real fluency with tools like these.
                    </p>
                    <p className="mb-6 text-sm leading-relaxed text-stone-500">
                        Whether you want hands-on training, a corporate adoption plan, or a custom AI build — let&apos;s start with a free 30-minute call.
                    </p>
                    <Link
                        href="/consulting#book"
                        className="inline-flex items-center gap-2 rounded-sm bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-700"
                    >
                        Book a Free Intro Call
                    </Link>
                </div>
            </article>
        </main>
    )
}
