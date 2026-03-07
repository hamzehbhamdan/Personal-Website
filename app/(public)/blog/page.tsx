
"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { ArrowRight, Search, X, ExternalLink } from "lucide-react"
import { blogPosts, type Category } from "@/lib/blog"
import { cn } from "@/lib/utils"

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

const CATEGORIES: (Category | "All")[] = ["All", "AI", "Projects", "Life"]

// ── Category pill ─────────────────────────────────────────────────────────────

function CategoryPill({ category }: { category: Category }) {
    const styles: Record<Category, string> = {
        AI: "text-[#A51C30]/80 bg-[#A51C30]/6 border-[#A51C30]/20",
        Projects: "text-stone-600 bg-stone-100 border-stone-200",
        Life: "text-stone-500 bg-stone-50 border-stone-200",
    }
    return (
        <span
            className={cn(
                "rounded-sm border px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.15em]",
                styles[category]
            )}
        >
            {category}
        </span>
    )
}

// ── Post card variants ────────────────────────────────────────────────────────

function AIPostCard({ post }: { post: (typeof blogPosts)[0] }) {
    const hasDemo = post.content.some((b) => b.type === "demo")
    return (
        <Link
            href={`/blog/${post.slug}`}
            className="group flex items-start justify-between gap-4 border-t border-stone-200 py-8 transition-colors hover:bg-stone-50/60 -mx-3 px-3 rounded-sm"
        >
            <div className="min-w-0 flex-1">
                <div className="mb-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <CategoryPill category="AI" />
                    {post.platforms?.map((p) => (
                        <span key={p} className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#A51C30]/70">
                            {p}
                        </span>
                    ))}
                    {post.topics.map((t) => (
                        <span key={t} className="font-mono text-[8px] uppercase tracking-[0.15em] text-stone-400">
                            {t}
                        </span>
                    ))}
                </div>

                <h2
                    className="mb-2 text-xl font-bold leading-snug text-stone-900 transition-colors group-hover:text-[#A51C30]"
                    style={serif}
                >
                    {post.title}
                </h2>

                <p className="mb-4 text-sm leading-relaxed text-stone-500 line-clamp-2">{post.excerpt}</p>

                <div className="flex items-center gap-4 font-mono text-[9px] uppercase tracking-[0.15em] text-stone-400">
                    <span>{post.date}</span>
                    <span className="text-stone-300">·</span>
                    <span>{post.readTime}</span>
                    {hasDemo && (
                        <>
                            <span className="text-stone-300">·</span>
                            <span className="flex items-center gap-1 text-[#A51C30]/60">
                                <ExternalLink className="h-2.5 w-2.5" /> Interactive
                            </span>
                        </>
                    )}
                </div>
            </div>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-stone-300 transition-colors group-hover:text-[#A51C30]" />
        </Link>
    )
}

function ProjectsPostCard({ post }: { post: (typeof blogPosts)[0] }) {
    const hasDemo = post.content.some((b) => b.type === "demo")
    return (
        <Link
            href={`/blog/${post.slug}`}
            className="group flex items-start justify-between gap-4 border-t border-stone-200 py-8 -mx-3 px-3 rounded-sm transition-all hover:bg-stone-50/60"
        >
            <div className="min-w-0 flex-1">
                <div className="mb-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <CategoryPill category="Projects" />
                    {post.topics.map((t) => (
                        <span key={t} className="font-mono text-[8px] uppercase tracking-[0.15em] text-stone-400">
                            {t}
                        </span>
                    ))}
                    {hasDemo && (
                        <span className="flex items-center gap-1 rounded-sm border border-stone-700/20 bg-stone-900/5 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.15em] text-stone-600">
                            <ExternalLink className="h-2.5 w-2.5" /> Demo
                        </span>
                    )}
                </div>

                <h2
                    className="mb-2 text-xl font-bold leading-snug text-stone-900 transition-colors group-hover:text-stone-700"
                    style={serif}
                >
                    {post.title}
                </h2>

                <p className="mb-4 text-sm leading-relaxed text-stone-500 line-clamp-2">{post.excerpt}</p>

                <div className="flex items-center gap-4 font-mono text-[9px] uppercase tracking-[0.15em] text-stone-400">
                    <span>{post.date}</span>
                    <span className="text-stone-300">·</span>
                    <span>{post.readTime}</span>
                </div>
            </div>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-stone-300 transition-colors group-hover:text-stone-600" />
        </Link>
    )
}

function LifePostCard({ post }: { post: (typeof blogPosts)[0] }) {
    return (
        <Link
            href={`/blog/${post.slug}`}
            className="group flex items-start justify-between gap-4 border-t border-stone-200 py-8 -mx-3 px-3 rounded-sm transition-colors hover:bg-stone-50/60"
        >
            <div className="min-w-0 flex-1">
                <div className="mb-2.5 flex items-center gap-2">
                    <CategoryPill category="Life" />
                    <span className="font-mono text-[9px] text-stone-400">{post.date}</span>
                </div>

                <h2
                    className="mb-2 text-xl font-bold leading-snug text-stone-900 transition-colors group-hover:text-stone-600"
                    style={serif}
                >
                    {post.title}
                </h2>

                <p className="mb-4 text-sm leading-relaxed text-stone-500 line-clamp-2">{post.excerpt}</p>

                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-400">
                    {post.readTime}
                </span>
            </div>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-stone-300 transition-colors group-hover:text-stone-500" />
        </Link>
    )
}

function PostCard({ post }: { post: (typeof blogPosts)[0] }) {
    if (post.category === "AI") return <AIPostCard post={post} />
    if (post.category === "Projects") return <ProjectsPostCard post={post} />
    return <LifePostCard post={post} />
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BlogPage() {
    const [search, setSearch] = useState("")
    const [activeCategory, setActiveCategory] = useState<Category | "All">("All")
    const [activeTopic, setActiveTopic] = useState<string | null>(null)
    const [activePlatform, setActivePlatform] = useState<string | null>(null)

    // Counts per category (unfiltered)
    const counts = useMemo(() => {
        const result: Record<Category | "All", number> = { All: blogPosts.length, AI: 0, Projects: 0, Life: 0 }
        blogPosts.forEach((p) => { result[p.category]++ })
        return result
    }, [])

    // AI-specific filter options
    const aiTopics = useMemo(() => {
        const s = new Set<string>()
        blogPosts.filter((p) => p.category === "AI").forEach((p) => p.topics.forEach((t) => s.add(t)))
        return [...s].sort()
    }, [])

    const aiPlatforms = useMemo(() => {
        const s = new Set<string>()
        blogPosts.filter((p) => p.category === "AI").forEach((p) => (p.platforms ?? []).forEach((pl) => s.add(pl)))
        return [...s].sort()
    }, [])

    const handleCategoryChange = (cat: Category | "All") => {
        setActiveCategory(cat)
        setActiveTopic(null)
        setActivePlatform(null)
    }

    const filtered = useMemo(() => {
        const q = search.toLowerCase()
        return blogPosts.filter((post) => {
            const matchesSearch =
                q === "" ||
                post.title.toLowerCase().includes(q) ||
                post.excerpt.toLowerCase().includes(q) ||
                post.topics.some((t) => t.toLowerCase().includes(q)) ||
                (post.platforms ?? []).some((p) => p.toLowerCase().includes(q))
            const matchesCategory = activeCategory === "All" || post.category === activeCategory
            const matchesTopic = !activeTopic || post.topics.includes(activeTopic)
            const matchesPlatform = !activePlatform || (post.platforms ?? []).includes(activePlatform)
            return matchesSearch && matchesCategory && matchesTopic && matchesPlatform
        })
    }, [search, activeCategory, activeTopic, activePlatform])

    const hasFilters = search || activeCategory !== "All" || activeTopic || activePlatform

    return (
        <main className="relative min-h-screen bg-[#f9f8f6] text-stone-900">
            <NoiseLayer />

            <div className="relative z-10 mx-auto max-w-2xl px-6 pb-24 pt-16">

                {/* Header */}
                <div className="mb-12">
                    <div className="mb-4 font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400">
                        Writing
                    </div>
                    <h1
                        className="text-4xl font-bold leading-tight text-stone-900 sm:text-5xl"
                        style={serif}
                    >
                        AI, projects,<br />and everything else.
                    </h1>
                </div>

                {/* ── Tab bar ─────────────────────────────────────────────── */}
                <div className="border-b border-stone-200 mb-0">
                    <div className="flex -mb-px">
                        {CATEGORIES.map((cat) => {
                            const isActive = activeCategory === cat
                            return (
                                <button
                                    key={cat}
                                    onClick={() => handleCategoryChange(cat)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-4 py-2.5 font-mono text-[9px] uppercase tracking-[0.15em] border-b-2 transition-all whitespace-nowrap",
                                        isActive
                                            ? cat === "AI"
                                                ? "border-[#A51C30] text-[#A51C30]"
                                                : "border-stone-800 text-stone-900"
                                            : "border-transparent text-stone-400 hover:text-stone-600"
                                    )}
                                >
                                    {cat}
                                    <span className={cn("tabular-nums", isActive ? "opacity-50" : "opacity-30")}>
                                        {counts[cat]}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* ── AI sub-filters (only when AI tab is active) ─────────── */}
                {activeCategory === "AI" && (
                    <div className="border-b border-stone-100 bg-stone-50/60 px-0 py-4 space-y-3">
                        {/* Topics */}
                        {aiTopics.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-stone-400 w-16 shrink-0">
                                    Topic
                                </span>
                                {aiTopics.map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setActiveTopic(activeTopic === t ? null : t)}
                                        className={cn(
                                            "rounded-sm border px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] transition-all",
                                            activeTopic === t
                                                ? "border-[#A51C30]/40 bg-[#A51C30]/8 text-[#A51C30]"
                                                : "border-stone-200 text-stone-400 hover:border-stone-300 hover:text-stone-600"
                                        )}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Platforms */}
                        {aiPlatforms.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-stone-400 w-16 shrink-0">
                                    Platform
                                </span>
                                {aiPlatforms.map((pl) => (
                                    <button
                                        key={pl}
                                        onClick={() => setActivePlatform(activePlatform === pl ? null : pl)}
                                        className={cn(
                                            "rounded-sm border px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] transition-all",
                                            activePlatform === pl
                                                ? "border-[#A51C30]/40 bg-[#A51C30]/8 text-[#A51C30]"
                                                : "border-stone-200 text-stone-400 hover:border-stone-300 hover:text-stone-600"
                                        )}
                                    >
                                        {pl}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Post list ────────────────────────────────────────────── */}
                <div className="mt-8">
                    {/* Search — directly above cards */}
                    <div className="relative mb-8">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                        <input
                            type="text"
                            placeholder="Search posts..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-sm border border-stone-200 bg-white/80 py-2.5 pl-9 pr-9 font-mono text-xs text-stone-800 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none transition-colors"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    {filtered.length === 0 ? (
                        <div className="py-20 text-center">
                            <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400">
                                No results
                            </div>
                            <p className="text-sm text-stone-500">No posts match the current filters.</p>
                            {hasFilters && (
                                <button
                                    onClick={() => {
                                        setSearch("")
                                        handleCategoryChange("All")
                                    }}
                                    className="mt-4 font-mono text-[9px] uppercase tracking-[0.15em] text-stone-400 underline hover:text-stone-700 transition-colors"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div>
                            {filtered.map((post, i) => (
                                <div
                                    key={post.slug}
                                    className={cn(i === filtered.length - 1 ? "border-b border-stone-200" : "")}
                                >
                                    <PostCard post={post} />
                                </div>
                            ))}

                            <div className="mt-5 font-mono text-[9px] text-stone-400">
                                {filtered.length} post{filtered.length !== 1 ? "s" : ""}
                                {hasFilters && " matching current filters"}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}
