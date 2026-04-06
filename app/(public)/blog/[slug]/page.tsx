
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Clock, Calendar, ExternalLink, FolderOpen, FileText, SlidersHorizontal, Layers, Zap, RefreshCw } from "lucide-react"
import { getBlogPost, blogPosts, type ContentBlock, type Category } from "@/lib/blog"
import { FourierSeriesFormula, DFTCoefficientsFormula } from "./formula-block"

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

// ── Category label ─────────────────────────────────────────────────────────────

function CategoryLabel({ category }: { category: Category }) {
    const styles: Record<Category, string> = {
        AI: "text-[#A51C30]/80 bg-[#A51C30]/6 border-[#A51C30]/20",
        Projects: "text-stone-600 bg-stone-100 border-stone-200",
        Life: "text-stone-500 bg-stone-50 border-stone-200",
    }
    return (
        <span
            className={`rounded-sm border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.15em] ${styles[category]}`}
        >
            {category}
        </span>
    )
}

// ── Diagrams ──────────────────────────────────────────────────────────────────

function DiagramChatGPT() {
    return (
        <div className="my-10 overflow-hidden rounded-sm border border-stone-200 bg-white/80">
            <div className="border-b border-stone-100 px-5 py-3">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400">
                    Three modes compared
                </span>
            </div>
            <div className="grid divide-y divide-stone-100 sm:divide-x sm:divide-y-0 sm:grid-cols-3">
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
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400">Execution pipeline</span>
            </div>
            <div className="space-y-px">
                <div className="bg-stone-50 px-5 py-4 text-center">
                    <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-400">Input</div>
                    <div className="mt-1 text-sm font-semibold text-stone-800" style={serif}>Natural Language Goal</div>
                    <div className="mt-0.5 text-[11px] text-stone-500">One instruction. Plain language. Any complexity.</div>
                </div>
                <div className="flex justify-center bg-stone-50 py-0.5 text-base font-bold text-stone-500">↓</div>
                <div className="bg-stone-50 px-5 py-4 text-center">
                    <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-400">Perplexity Computer</div>
                    <div className="mt-1 text-sm font-semibold text-stone-800" style={serif}>Task Decomposition</div>
                    <div className="mt-0.5 text-[11px] text-stone-500">Goal → ordered subtasks → subtasks routed to best-fit model → parallel execution</div>
                </div>
                <div className="flex justify-center bg-stone-50 py-0.5 text-base font-bold text-stone-500">↓</div>
                <div className="bg-[#A51C30]/[0.04] px-5 py-5">
                    <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.15em] text-[#A51C30]">Multi-Model Orchestration — 19 Models Total</div>
                    <div className="mb-3 text-[10px] text-stone-500">6 publicly named · 13 undisclosed · roster updates as better models emerge</div>
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                        {models.map((m) => (
                            <div key={m.name} className="rounded-sm border border-[#A51C30]/15 bg-white/80 px-2.5 py-2">
                                <div className="text-[10px] font-semibold text-stone-800">{m.name}</div>
                                <div className="font-mono text-[8px] uppercase tracking-[0.1em] text-stone-400">{m.role}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-center bg-[#A51C30]/[0.02] py-0.5 text-base font-bold text-stone-500">↓</div>
                <div className="bg-stone-50 px-5 py-4">
                    <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.15em] text-stone-400">400+ Connectors & Cloud Tools</div>
                    <div className="flex flex-wrap gap-1.5">
                        {connectors.map((c) => (
                            <span key={c} className="rounded-sm border border-stone-200 bg-white px-2 py-0.5 font-mono text-[9px] text-stone-600">{c}</span>
                        ))}
                    </div>
                </div>
                <div className="flex justify-center bg-stone-50 py-0.5 text-base font-bold text-stone-500">↓</div>
                <div className="border-y border-stone-200 bg-stone-100 px-5 py-3 text-center">
                    <div className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-500">Human Approval Gate</div>
                    <div className="mt-0.5 text-[11px] text-stone-500">Pauses before irreversible actions — sending emails, pushing code, publishing sites</div>
                </div>
                <div className="flex justify-center bg-stone-50 py-0.5 text-base font-bold text-stone-500">↓</div>
                <div className="bg-stone-50 px-5 py-4">
                    <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.15em] text-stone-400">Finished Output</div>
                    <div className="flex flex-wrap gap-1.5">
                        {outputs.map((o) => (
                            <span key={o} className="rounded-sm bg-stone-900 px-2 py-0.5 font-mono text-[9px] text-stone-200">{o}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function DiagramDeepResearchPipeline() {
    const steps = [
        { num: "01", label: "Query Decomposition", detail: "Your prompt is broken into ordered subtasks — you review and adjust the plan before the agent starts" },
        { num: "02", label: "Agentic Browsing", detail: "Autonomously visits 50–200 web sources, reading full pages rather than snippets" },
        { num: "03", label: "Critical Synthesis", detail: "Filters low-credibility sources, cross-references facts, aggregates the strongest evidence" },
        { num: "04", label: "Structured Output", detail: "Organizes findings into labeled sections with inline citations and a full reference list" },
        { num: "05", label: "Iterative Refinement", detail: "Loops back to close gaps or resolve contradictions before delivering the final report" },
    ]
    return (
        <div className="my-10 overflow-hidden rounded-sm border border-stone-200 bg-white/80">
            <div className="border-b border-stone-100 px-5 py-3">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400">Deep Research — how the pipeline works</span>
            </div>
            <div className="divide-y divide-stone-100">
                {steps.map((step) => (
                    <div key={step.num} className="flex items-start gap-4 px-5 py-4">
                        <div className="shrink-0 font-mono text-[9px] uppercase tracking-[0.2em] text-[#A51C30] pt-0.5">{step.num}</div>
                        <div>
                            <div className="text-xs font-bold text-stone-800">{step.label}</div>
                            <div className="mt-0.5 text-[11px] leading-relaxed text-stone-500">{step.detail}</div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="border-t border-stone-100 bg-stone-50 px-5 py-3">
                <span className="font-mono text-[9px] text-stone-400">Output: structured cited report · 1,500–3,000 words · inline citations · reference list</span>
            </div>
        </div>
    )
}

function DiagramDeepResearchComparison() {
    const rows = [
        { label: "Time to complete", traditional: "1–3 hours", deep: "5–30 minutes" },
        { label: "Sources consulted", traditional: "5–15 (manual)", deep: "50–200 (automated)" },
        { label: "Output format", traditional: "Notes / bookmarks", deep: "Structured cited report" },
        { label: "Citation tracking", traditional: "Manual copy-paste", deep: "Automatic, inline" },
        { label: "Cross-source synthesis", traditional: "Done by you", deep: "Done by the agent" },
        { label: "Paywalled content", traditional: "With subscription", deep: "Not accessible" },
        { label: "Hallucination risk", traditional: "None (primary)", deep: "Low — verify key claims" },
    ]
    return (
        <div className="my-10 overflow-hidden rounded-sm border border-stone-200 bg-white/80">
            <div className="border-b border-stone-100 px-5 py-3">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400">Manual research vs. Deep Research</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                    <thead>
                        <tr className="border-b border-stone-100 bg-stone-50">
                            <th className="px-5 py-2.5 text-left font-mono text-[9px] uppercase tracking-[0.15em] text-stone-400 w-1/3"></th>
                            <th className="px-4 py-2.5 text-left font-mono text-[9px] uppercase tracking-[0.15em] text-stone-400">Manual</th>
                            <th className="px-4 py-2.5 text-left font-mono text-[9px] uppercase tracking-[0.15em] text-[#A51C30]">Deep Research</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                        {rows.map((row) => (
                            <tr key={row.label} className="hover:bg-stone-50/50">
                                <td className="px-5 py-2.5 font-medium text-stone-700">{row.label}</td>
                                <td className="px-4 py-2.5 text-stone-400">{row.traditional}</td>
                                <td className="px-4 py-2.5 text-stone-800 font-semibold">{row.deep}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function DiagramCanvasComparison() {
    const rows = [
        { label: "Output lives in", chat: "Chat bubble — disappears on next reply", canvas: "Persistent editable document panel" },
        { label: "Making changes", chat: "Request a full regeneration", canvas: "Highlight a section, change just that part" },
        { label: "Version history", chat: "None", canvas: "Auto-saved — restore any prior version" },
        { label: "Code rendering", chat: "Text only", canvas: "Live HTML & React preview in-panel" },
        { label: "Reading level", chat: "Re-prompt each time", canvas: "One-click adjust (K–Graduate)" },
        { label: "Polish / grammar", chat: "Re-prompt each time", canvas: "One-click full-document pass" },
        { label: "Best for", chat: "Questions, quick tasks", canvas: "Writing, coding, anything iterative" },
    ]
    return (
        <div className="my-10 overflow-hidden rounded-sm border border-stone-200 bg-white/80">
            <div className="border-b border-stone-100 px-5 py-3">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400">Standard chat vs. Canvas</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                    <thead>
                        <tr className="border-b border-stone-100 bg-stone-50">
                            <th className="px-5 py-2.5 text-left font-mono text-[9px] uppercase tracking-[0.15em] text-stone-400 w-1/3"></th>
                            <th className="px-4 py-2.5 text-left font-mono text-[9px] uppercase tracking-[0.15em] text-stone-400">Standard Chat</th>
                            <th className="px-4 py-2.5 text-left font-mono text-[9px] uppercase tracking-[0.15em] text-[#A51C30]">Canvas</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                        {rows.map((row) => (
                            <tr key={row.label} className="hover:bg-stone-50/50">
                                <td className="px-5 py-2.5 font-medium text-stone-700">{row.label}</td>
                                <td className="px-4 py-2.5 text-stone-400">{row.chat}</td>
                                <td className="px-4 py-2.5 text-stone-800 font-semibold">{row.canvas}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function DiagramCanvasShortcuts() {
    const writing = [
        { name: "Adjust length", detail: "Expand or compress while preserving structure" },
        { name: "Change reading level", detail: "Kindergarten → Graduate, one click" },
        { name: "Add final polish", detail: "Grammar, clarity, and consistency — full doc" },
        { name: "Suggest edits", detail: "Inline suggestions you accept or reject" },
        { name: "Direct editing", detail: "Click anywhere and type; changes are preserved" },
    ]
    const coding = [
        { name: "Review code", detail: "Inline suggestions with explanations" },
        { name: "Add comments", detail: "Docs generated at non-obvious logic points" },
        { name: "Add logs", detail: "Debug statements at key branches" },
        { name: "Fix bugs", detail: "Rewrites problems with plain-English explanation" },
        { name: "Port to language", detail: "JS, TS, Python, Java, C++, or PHP" },
        { name: "Live preview", detail: "HTML & React renders in-panel instantly" },
    ]
    return (
        <div className="my-10 overflow-hidden rounded-sm border border-stone-200 bg-white/80">
            <div className="border-b border-stone-100 px-5 py-3">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400">Canvas shortcuts — writing & coding</span>
            </div>
            <div className="grid divide-y divide-stone-100 sm:divide-x sm:divide-y-0 sm:grid-cols-2">
                <div className="p-5">
                    <div className="mb-4 font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400">Writing</div>
                    <div className="space-y-3">
                        {writing.map((s) => (
                            <div key={s.name}>
                                <div className="text-[11px] font-semibold text-stone-800">{s.name}</div>
                                <div className="text-[10px] text-stone-500">{s.detail}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-[#A51C30]/[0.03] p-5">
                    <div className="mb-4 font-mono text-[9px] uppercase tracking-[0.2em] text-[#A51C30]">Coding</div>
                    <div className="space-y-3">
                        {coding.map((s) => (
                            <div key={s.name}>
                                <div className="text-[11px] font-semibold text-stone-800">{s.name}</div>
                                <div className="text-[10px] text-stone-500">{s.detail}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function DiagramAppsDirectory() {
    const apps = [
        {
            name: "DoorDash", category: "Food & Delivery",
            what: "Browse restaurants, view menus, and place food orders without leaving ChatGPT",
            example: "\"Order my usual from Chipotle\" → DoorDash surfaces, confirms, and places the order",
        },
        {
            name: "Zillow", category: "Real Estate",
            what: "Search live property listings, filter by criteria, and save homes to your list",
            example: "\"Show me 2BR apartments in Logan Square under $2k\" → live listings appear in chat",
        },
        {
            name: "Khan Academy", category: "Education",
            what: "Access interactive lessons and practice problems directly inside a study conversation",
            example: "\"Walk me through quadratic equations with practice problems\" → lesson + exercises load in chat",
        },
        {
            name: "Apple Music", category: "Music",
            what: "Generate playlists, queue tracks, and get music recommendations that play immediately",
            example: "\"Make me a focus playlist for deep work\" → playlist is created and ready to play",
        },
    ]
    return (
        <div className="my-10 overflow-hidden rounded-sm border border-stone-200 bg-white/80">
            <div className="border-b border-stone-100 px-5 py-3">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400">App Directory — launch apps and what they do</span>
            </div>
            <div className="divide-y divide-stone-100">
                {apps.map((app) => (
                    <div key={app.name} className="px-5 py-4">
                        <div className="mb-1 flex items-baseline gap-3">
                            <span className="text-xs font-bold text-stone-900">{app.name}</span>
                            <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-stone-400">{app.category}</span>
                        </div>
                        <p className="mb-1.5 text-[11px] text-stone-600">{app.what}</p>
                        <p className="text-[10px] italic text-stone-400">{app.example}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

function DiagramAppsInvoke() {
    const steps = [
        { num: "01", label: "Find it in the App Directory", detail: "Tools menu → App Directory → browse by category (Featured, Lifestyle, Productivity, Education, Shopping)" },
        { num: "02", label: "Connect and authorize", detail: "Click Connect → approve OAuth access → the app appears in your workspace. Takes about 10 seconds." },
        { num: "03", label: "Invoke in any conversation", detail: "Type @AppName to call it directly, or ChatGPT may suggest it automatically when the conversation context fits." },
    ]
    return (
        <div className="my-10 overflow-hidden rounded-sm border border-stone-200 bg-white/80">
            <div className="border-b border-stone-100 px-5 py-3">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400">How to add and use an app</span>
            </div>
            <div className="divide-y divide-stone-100">
                {steps.map((step, i) => (
                    <div key={step.num} className={i === 2 ? "bg-[#A51C30]/[0.03] px-5 py-5" : "px-5 py-5"}>
                        <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-[#A51C30]">{step.num}</div>
                        <div className="mb-1 text-sm font-bold text-stone-900">{step.label}</div>
                        <div className="text-[11px] leading-relaxed text-stone-500">{step.detail}</div>
                    </div>
                ))}
            </div>
            <div className="border-t border-stone-100 bg-stone-50 px-5 py-3">
                <span className="font-mono text-[9px] text-stone-400">Available on web, iOS, and Android · outside EEA/UK/Switzerland</span>
            </div>
        </div>
    )
}

function DiagramCoworkVsChat() {
    const chatSteps = [
        { label: "You type a prompt", sub: "Ask it to organize files, build a report, draft an email" },
        { label: "Claude responds in chat", sub: "Explains what to do, gives you a draft or a plan" },
        { label: "You leave the chat", sub: "Open Excel, Finder, your email client, your browser…" },
        { label: "You do the work yourself", sub: "Copy-paste, click through apps, format the output" },
    ]
    const coworkSteps = [
        { label: "You describe the outcome", sub: "\"Organize my project folder and rename files consistently\"" },
        { label: "Cowork shows a plan", sub: "You review the steps before anything runs" },
        { label: "It executes autonomously", sub: "Reads files, opens apps, navigates, builds the output" },
        { label: "Finished work delivered", sub: "A real file on your machine. Not a chat reply." },
    ]
    const access = ["Local files", "Desktop apps", "Browser", "Email", "Integrations"]
    return (
        <div className="my-10 overflow-hidden rounded-sm border border-stone-200 bg-white/80">
            <div className="border-b border-stone-100 px-5 py-3">
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400">Regular Claude chat vs. Cowork</span>
            </div>
            <div className="grid divide-y divide-stone-100 sm:divide-x sm:divide-y-0 sm:grid-cols-2">
                {/* Left — Chat */}
                <div className="p-5">
                    <div className="mb-1 font-mono text-[8px] uppercase tracking-[0.2em] text-stone-400">01</div>
                    <div className="mb-4 text-xs font-bold text-stone-700">Regular Claude Chat</div>
                    <div className="space-y-1.5">
                        {chatSteps.map((s, i) => (
                            <div key={i}>
                                <div className="rounded-sm border border-stone-200 bg-stone-50 px-3 py-2">
                                    <div className="text-[10px] font-semibold text-stone-700">{s.label}</div>
                                    <div className="text-[9px] text-stone-400">{s.sub}</div>
                                </div>
                                {i < chatSteps.length - 1 && (
                                    <div className="py-1 text-center text-sm font-bold text-stone-400">↓</div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 rounded-sm bg-stone-100 px-3 py-2">
                        <div className="text-[9px] font-semibold text-stone-500">Output</div>
                        <div className="text-[9px] text-stone-400">Text in a chat bubble. You still do the work.</div>
                    </div>
                </div>

                {/* Right — Cowork */}
                <div className="bg-[#A51C30]/[0.03] p-5">
                    <div className="mb-1 font-mono text-[8px] uppercase tracking-[0.2em] text-[#A51C30]">02</div>
                    <div className="mb-4 text-xs font-bold text-stone-700">Claude Cowork</div>
                    <div className="space-y-1.5">
                        {coworkSteps.map((s, i) => (
                            <div key={i}>
                                <div className="rounded-sm border border-[#A51C30]/20 bg-white/80 px-3 py-2">
                                    <div className="text-[10px] font-semibold text-stone-700">{s.label}</div>
                                    <div className="text-[9px] text-stone-400">{s.sub}</div>
                                </div>
                                {i === 1 && (
                                    <div className="my-1.5 rounded-sm border border-[#A51C30]/10 bg-white/60 px-3 py-1.5">
                                        <div className="mb-1 font-mono text-[8px] uppercase tracking-[0.1em] text-[#A51C30]/70">Has access to</div>
                                        <div className="flex flex-wrap gap-1">
                                            {access.map((a) => (
                                                <span key={a} className="rounded-sm bg-[#A51C30]/8 px-1.5 py-0.5 font-mono text-[8px] text-[#A51C30]/80">{a}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {i < coworkSteps.length - 1 && (
                                    <div className="py-1 text-center text-sm font-bold text-[#A51C30]/40">↓</div>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 rounded-sm bg-[#A51C30]/10 px-3 py-2">
                        <div className="text-[9px] font-semibold text-[#A51C30]">Output</div>
                        <div className="text-[9px] text-[#A51C30]/70">A finished file on your machine. Work is done.</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function DiagramCoworkProjects() {
    const sessions = [
        {
            label: "Session 1",
            highlight: false,
            context: [
                { icon: <FolderOpen size={10} />, text: "Files uploaded" },
                { icon: <FileText size={10} />, text: "First brief set" },
            ],
            output: "Draft v1 — correct but generic",
            outputNote: "Starts from scratch",
        },
        {
            label: "Session 2",
            highlight: false,
            context: [
                { icon: <FolderOpen size={10} />, text: "Files still there" },
                { icon: <SlidersHorizontal size={10} />, text: "Format prefs remembered" },
                { icon: <FileText size={10} />, text: "Prior draft on file" },
            ],
            output: "Draft v2 — applies your style",
            outputNote: "No re-uploading",
        },
        {
            label: "Session 3+",
            highlight: true,
            context: [
                { icon: <FolderOpen size={10} />, text: "All files" },
                { icon: <SlidersHorizontal size={10} />, text: "All instructions" },
                { icon: <FileText size={10} />, text: "Full work history" },
                { icon: <Layers size={10} />, text: "Accumulated context" },
            ],
            output: "Best output yet",
            outputNote: "Zero setup. Zero re-explaining.",
        },
    ]
    return (
        <div className="my-10 overflow-hidden rounded-sm border border-stone-200 bg-white/80">
            <div className="flex items-center gap-2.5 border-b border-stone-100 px-5 py-3.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-stone-100">
                    <Layers size={12} className="text-stone-500" />
                </div>
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400">Projects — context that compounds</span>
            </div>
            <div className="grid divide-y divide-stone-100 sm:divide-x sm:divide-y-0 sm:grid-cols-3">
                {sessions.map((s) => (
                    <div key={s.label} className={`flex flex-col p-5 ${s.highlight ? "bg-[#A51C30]/[0.03]" : ""}`}>
                        <div className={`mb-3 font-mono text-[8px] uppercase tracking-[0.2em] ${s.highlight ? "text-[#A51C30]" : "text-stone-400"}`}>{s.label}</div>

                        {/* Context stack */}
                        <div className={`mb-4 flex-1 rounded-sm border p-3 ${s.highlight ? "border-[#A51C30]/20 bg-white/60" : "border-stone-200 bg-stone-50"}`}>
                            <div className="mb-2 font-mono text-[8px] uppercase tracking-[0.1em] text-stone-400">Loaded context</div>
                            <div className="space-y-1.5">
                                {s.context.map((c, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm ${s.highlight ? "bg-[#A51C30]/10 text-[#A51C30]" : "bg-stone-200 text-stone-500"}`}>
                                            {c.icon}
                                        </div>
                                        <span className="text-[10px] text-stone-600">{c.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Output */}
                        <div className={`rounded-sm px-3 py-2 ${s.highlight ? "bg-[#A51C30]/10" : "bg-stone-100"}`}>
                            <div className={`text-[10px] font-semibold ${s.highlight ? "text-[#A51C30]" : "text-stone-700"}`}>{s.output}</div>
                            <div className={`mt-0.5 font-mono text-[8px] ${s.highlight ? "text-[#A51C30]/70" : "text-stone-400"}`}>{s.outputNote}</div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="border-t border-stone-100 bg-stone-50 px-5 py-3">
                <span className="font-mono text-[9px] text-stone-400">One setup · instructions persist · files stay loaded · context never resets</span>
            </div>
        </div>
    )
}

function DiagramCoworkScheduledTasks() {
    const loop = [
        { icon: <SlidersHorizontal size={13} />, label: "You set it once", sub: "Describe the task and schedule" },
        { icon: <Clock size={13} />, label: "Schedule triggers", sub: "Mon 8 am, last of month…" },
        { icon: <Zap size={13} />, label: "Cowork executes", sub: "Reads files, builds output" },
        { icon: <FileText size={13} />, label: "Output delivered", sub: "File, email, or report ready" },
    ]
    const tasks = [
        { time: "MON  8 AM", task: "Pull last week's data from Drive, generate report, drop in shared folder" },
        { time: "LAST OF MONTH", task: "Read receipts folder, build expense spreadsheet, email to finance" },
        { time: "DAILY  7 AM", task: "Triage flagged emails, draft prioritized reply suggestions" },
        { time: "EVERY SUNDAY", task: "Scan competitor sites for changes, deliver change summary" },
    ]
    return (
        <div className="my-10 overflow-hidden rounded-sm border border-stone-200 bg-white/80">
            <div className="flex items-center gap-2.5 border-b border-stone-100 px-5 py-3.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-[#A51C30]/10">
                    <RefreshCw size={12} className="text-[#A51C30]" />
                </div>
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400">Scheduled Tasks — work that runs without you</span>
            </div>

            {/* Loop flow */}
            <div className="border-b border-stone-100 px-4 py-5">
                <div className="grid grid-cols-4 items-center gap-1.5">
                    {loop.map((step, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                            <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-sm border border-stone-200 bg-stone-50 px-2 py-2.5 text-center">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500">
                                    {step.icon}
                                </div>
                                <div className="text-[10px] font-semibold leading-tight text-stone-800">{step.label}</div>
                                <div className="text-[9px] leading-tight text-stone-400">{step.sub}</div>
                            </div>
                            {i < loop.length - 1 ? (
                                <span className="shrink-0 font-bold text-stone-300">→</span>
                            ) : (
                                <div className="flex shrink-0 items-center gap-0.5">
                                    <span className="font-bold text-stone-300">→</span>
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[#A51C30]/20 bg-[#A51C30]/5">
                                        <RefreshCw size={10} className="text-[#A51C30]" />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Task examples */}
            <div className="divide-y divide-stone-50">
                {tasks.map((t) => (
                    <div key={t.time} className="flex items-start gap-4 px-5 py-3.5">
                        <div className="flex items-center gap-2 shrink-0">
                            <Zap size={11} className="text-[#A51C30]/60" />
                            <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#A51C30]/80 w-24">{t.time}</span>
                        </div>
                        <span className="text-[11px] leading-relaxed text-stone-600">{t.task}</span>
                    </div>
                ))}
            </div>
            <div className="border-t border-stone-100 bg-[#A51C30]/[0.03] px-5 py-3">
                <span className="font-mono text-[9px] text-[#A51C30]/70">Set once · runs indefinitely · pauses only when your input is genuinely needed</span>
            </div>
        </div>
    )
}

function renderDiagram(id: string, index: number) {
    if (id === "chatgpt-architecture") return <DiagramChatGPT key={index} />
    if (id === "perplexity-architecture") return <DiagramPerplexity key={index} />
    if (id === "deep-research-pipeline") return <DiagramDeepResearchPipeline key={index} />
    if (id === "deep-research-comparison") return <DiagramDeepResearchComparison key={index} />
    if (id === "canvas-comparison") return <DiagramCanvasComparison key={index} />
    if (id === "canvas-shortcuts") return <DiagramCanvasShortcuts key={index} />
    if (id === "chatgpt-apps-directory") return <DiagramAppsDirectory key={index} />
    if (id === "chatgpt-apps-invoke") return <DiagramAppsInvoke key={index} />
    if (id === "cowork-vs-chat") return <DiagramCoworkVsChat key={index} />
    if (id === "cowork-projects") return <DiagramCoworkProjects key={index} />
    if (id === "cowork-scheduled-tasks") return <DiagramCoworkScheduledTasks key={index} />
    return null
}

// ── Demo embed ────────────────────────────────────────────────────────────────

function DemoBlock({ url, title, height }: { url: string; title?: string; description?: string; height?: number }) {
    const frameHeight = height ?? 720
    return (
        <div className="my-10 -mx-4 sm:-mx-6 lg:-mx-8 overflow-hidden border-y border-stone-200">
            <iframe
                src={url}
                title={title ?? "Interactive Demo"}
                className="block w-full border-0"
                style={{ height: `${frameHeight}px` }}
                loading="lazy"
                sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-modals allow-pointer-lock"
            />
        </div>
    )
}

// ── Content renderer ──────────────────────────────────────────────────────────

function renderBlock(block: ContentBlock, index: number) {
    switch (block.type) {
        case "heading":
            return (
                <h2 key={index} className="mb-4 mt-12 text-2xl font-bold leading-snug text-stone-900" style={serif}>
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
                <div key={index} className="my-8 rounded-sm border-l-2 border-[#A51C30] bg-[#A51C30]/5 px-6 py-5">
                    <p className="text-sm italic leading-relaxed text-[#7a0e1e]">{block.text}</p>
                </div>
            )
        case "diagram":
            return renderDiagram(block.id, index)
        case "formula":
            if (block.id === "fourier-series") return <FourierSeriesFormula key={index} />
            if (block.id === "dft-coefficients") return <DFTCoefficientsFormula key={index} />
            return null
        case "demo":
            return <DemoBlock key={index} url={block.url} title={block.title} description={block.description} height={block.height} />
        default:
            return null
    }
}

// ── CTA variants by category ──────────────────────────────────────────────────

function PostCTA({ category }: { category: Category }) {
    if (category === "Projects") {
        return (
            <div className="rounded-sm border border-stone-200 bg-white/70 p-8">
                <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400">
                    Playground
                </div>
                <p className="mb-5 text-xl font-semibold leading-snug text-stone-800" style={serif}>
                    See more interactive experiments.
                </p>
                <p className="mb-6 text-sm leading-relaxed text-stone-500">
                    The playground is where I put things built for the joy of building — visualizations, tools, and demos you can use right in the browser.
                </p>
                <Link
                    href="/playground"
                    className="inline-flex items-center gap-2 rounded-sm bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-700"
                >
                    Browse the Playground
                </Link>
            </div>
        )
    }

    // AI (default) CTA
    return (
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
    )
}

// ── Static params & metadata ──────────────────────────────────────────────────

export async function generateStaticParams() {
    return blogPosts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const post = getBlogPost(slug)
    if (!post) return {}
    return { title: post.title, description: post.excerpt }
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
                    href="/blog"
                    className="mb-14 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400 transition-colors hover:text-stone-700"
                >
                    <ArrowLeft className="h-3 w-3" /> All Posts
                </Link>

                {/* Header */}
                <header className="mb-12">
                    <div className="mb-5 flex flex-wrap gap-2">
                        <CategoryLabel category={post.category} />
                        {post.platforms?.map((p) => (
                            <span
                                key={p}
                                className="rounded-sm border border-[#A51C30]/20 bg-[#A51C30]/5 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-[#A51C30]/80"
                            >
                                {p}
                            </span>
                        ))}
                        {post.topics.map((t) => (
                            <span
                                key={t}
                                className="rounded-sm border border-stone-200 bg-stone-50 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.15em] text-stone-500"
                            >
                                {t}
                            </span>
                        ))}
                    </div>

                    <h1 className="mb-6 text-4xl font-bold leading-tight text-stone-900 sm:text-5xl" style={serif}>
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
                <PostCTA category={post.category} />
            </article>
        </main>
    )
}
