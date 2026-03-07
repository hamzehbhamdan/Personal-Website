
"use client"

import React, { useState, useMemo } from "react"
import Link from "next/link"
import { ArrowRight, Search, X } from "lucide-react"
import { blogPosts } from "@/lib/consulting-blog"
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

export default function BlogPage() {
    const [search, setSearch] = useState("")
    const [activeTopic, setActiveTopic] = useState<string | null>(null)
    const [activePlatform, setActivePlatform] = useState<string | null>(null)

    const allTopics = useMemo(() => {
        const set = new Set<string>()
        blogPosts.forEach((post) => post.topics.forEach((t) => set.add(t)))
        return Array.from(set).sort()
    }, [])

    const allPlatforms = useMemo(() => {
        const set = new Set<string>()
        blogPosts.forEach((post) => post.platforms.forEach((p) => set.add(p)))
        return Array.from(set).sort()
    }, [])

    const filtered = useMemo(() => {
        const q = search.toLowerCase()
        return blogPosts.filter((post) => {
            const matchesSearch =
                q === "" ||
                post.title.toLowerCase().includes(q) ||
                post.excerpt.toLowerCase().includes(q) ||
                post.topics.some((t) => t.toLowerCase().includes(q)) ||
                post.platforms.some((p) => p.toLowerCase().includes(q))
            const matchesTopic = activeTopic === null || post.topics.includes(activeTopic)
            const matchesPlatform = activePlatform === null || post.platforms.includes(activePlatform)
            return matchesSearch && matchesTopic && matchesPlatform
        })
    }, [search, activeTopic, activePlatform])

    const hasFilters = search || activeTopic || activePlatform

    return (
        <main className="relative min-h-screen bg-[#f9f8f6] text-stone-900">
            <NoiseLayer />

            <div className="relative z-10 mx-auto max-w-2xl px-6 pb-24 pt-16">

                {/* Header */}
                <div className="mb-14">
                    <div className="mb-4 font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400">
                        Insights
                    </div>
                    <h1
                        className="text-4xl font-bold leading-tight text-stone-900 sm:text-5xl"
                        style={serif}
                    >
                        Writing on AI tools,<br />adoption, and practice.
                    </h1>
                </div>

                {/* Search */}
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

                {/* Filters */}
                <div className="mb-10 space-y-4">
                    {/* Topics row */}
                    <div>
                        <div className="mb-2 font-mono text-[8px] uppercase tracking-[0.2em] text-stone-400">
                            Topics
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setActiveTopic(null)}
                                className={cn(
                                    "rounded-sm border px-3 py-1 font-mono text-[9px] uppercase tracking-[0.15em] transition-all",
                                    activeTopic === null
                                        ? "border-stone-800 bg-stone-900 text-white"
                                        : "border-stone-200 text-stone-500 hover:border-stone-400 hover:text-stone-700"
                                )}
                            >
                                All
                            </button>
                            {allTopics.map((topic) => (
                                <button
                                    key={topic}
                                    onClick={() => setActiveTopic(activeTopic === topic ? null : topic)}
                                    className={cn(
                                        "rounded-sm border px-3 py-1 font-mono text-[9px] uppercase tracking-[0.15em] transition-all",
                                        activeTopic === topic
                                            ? "border-[#A51C30] bg-[#A51C30]/10 text-[#A51C30]"
                                            : "border-stone-200 text-stone-500 hover:border-stone-300 hover:text-stone-700"
                                    )}
                                >
                                    {topic}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Platforms row */}
                    <div>
                        <div className="mb-2 font-mono text-[8px] uppercase tracking-[0.2em] text-stone-400">
                            Platforms
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setActivePlatform(null)}
                                className={cn(
                                    "rounded-sm border px-3 py-1 font-mono text-[9px] uppercase tracking-[0.15em] transition-all",
                                    activePlatform === null
                                        ? "border-stone-800 bg-stone-900 text-white"
                                        : "border-stone-200 text-stone-500 hover:border-stone-400 hover:text-stone-700"
                                )}
                            >
                                All
                            </button>
                            {allPlatforms.map((platform) => (
                                <button
                                    key={platform}
                                    onClick={() => setActivePlatform(activePlatform === platform ? null : platform)}
                                    className={cn(
                                        "rounded-sm border px-3 py-1 font-mono text-[9px] uppercase tracking-[0.15em] transition-all",
                                        activePlatform === platform
                                            ? "border-[#A51C30] bg-[#A51C30]/10 text-[#A51C30]"
                                            : "border-stone-200 text-stone-500 hover:border-stone-300 hover:text-stone-700"
                                    )}
                                >
                                    {platform}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Post list */}
                {filtered.length === 0 ? (
                    <div className="py-20 text-center">
                        <div className="mb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400">
                            No results
                        </div>
                        <p className="text-sm text-stone-500">
                            No posts match the current filters.
                        </p>
                    </div>
                ) : (
                    <div>
                        {filtered.map((post, i) => (
                            <Link
                                key={post.slug}
                                href={`/consulting/blog/${post.slug}`}
                                className={cn(
                                    "group flex items-start justify-between gap-4 border-t border-stone-200 py-8 transition-colors hover:bg-stone-50/60 -mx-3 px-3 rounded-sm",
                                    i === filtered.length - 1 && "border-b"
                                )}
                            >
                                <div className="min-w-0 flex-1">
                                    {/* Tags */}
                                    <div className="mb-2.5 flex flex-wrap gap-x-3 gap-y-1">
                                        {post.platforms.map((p) => (
                                            <span
                                                key={p}
                                                className="font-mono text-[8px] uppercase tracking-[0.15em] text-[#A51C30]/70"
                                            >
                                                {p}
                                            </span>
                                        ))}
                                        {post.topics.map((t) => (
                                            <span
                                                key={t}
                                                className="font-mono text-[8px] uppercase tracking-[0.15em] text-stone-400"
                                            >
                                                {t}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Title */}
                                    <h2
                                        className="mb-2 text-xl font-bold leading-snug text-stone-900 transition-colors group-hover:text-[#A51C30]"
                                        style={serif}
                                    >
                                        {post.title}
                                    </h2>

                                    {/* Excerpt */}
                                    <p className="mb-4 text-sm leading-relaxed text-stone-500 line-clamp-2">
                                        {post.excerpt}
                                    </p>

                                    {/* Meta */}
                                    <div className="flex items-center gap-4 font-mono text-[9px] uppercase tracking-[0.15em] text-stone-400">
                                        <span>{post.date}</span>
                                        <span className="text-stone-300">·</span>
                                        <span>{post.readTime}</span>
                                    </div>
                                </div>

                                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-stone-300 transition-colors group-hover:text-[#A51C30]" />
                            </Link>
                        ))}

                        <div className="mt-5 font-mono text-[9px] text-stone-400">
                            {filtered.length} post{filtered.length !== 1 ? "s" : ""}
                            {hasFilters && " matching current filters"}
                        </div>
                    </div>
                )}
            </div>
        </main>
    )
}
