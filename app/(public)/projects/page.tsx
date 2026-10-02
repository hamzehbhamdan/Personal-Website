
"use client"

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { projects } from "@/lib/data";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const serif = { fontFamily: "var(--font-playfair), Georgia, 'Times New Roman', serif" };

type Project = (typeof projects)[number];

function ProjectCard({ project }: { project: Project }) {
    return (
        <Link
            href={`/projects/${project.slug}`}
            className="group flex h-full flex-col border-t border-stone-300 pt-5 transition-colors hover:border-stone-900 space-y-3"
        >
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-500">
                {project.type}
            </p>
            <h2
                className="text-lg font-medium text-stone-900 leading-snug group-hover:text-[#A51C30] transition-colors"
                style={serif}
            >
                {project.title}
            </h2>
            <p className="text-[14px] text-stone-600 leading-relaxed line-clamp-4 flex-1">
                {project.description}
            </p>
            <p className="font-mono text-[11px] text-stone-500">
                {project.tags.slice(0, 3).join(" · ")}
            </p>
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-stone-600 group-hover:text-[#A51C30] transition-colors">
                Details
                <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
        </Link>
    );
}

const CATEGORIES = ["All", "Finance", "Sports", "AI", "ML", "Data Science", "Other"];

function matchesFilter(tags: string[], filter: string) {
    if (filter === "All") return true;
    if (filter === "Data Science")
        return tags.includes("Data Science") || tags.includes("Statistics");
    return tags.includes(filter);
}

export default function ProjectsPage() {
    const [filter, setFilter] = useState("All");

    const activeProjects = projects.filter((p) => matchesFilter(p.tags, filter));

    const getCount = (cat: string) => {
        if (cat === "All") return projects.length;
        return projects.filter((p) => matchesFilter(p.tags, cat)).length;
    };

    return (
        <main className="flex flex-col min-h-screen bg-[#f9f8f6]">
            {/* Noise texture */}
            <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 z-0"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "repeat",
                    backgroundSize: "300px 300px",
                    opacity: 0.028,
                }}
            />

            {/* Header */}
            <section className="relative z-10 w-full pt-16 pb-10 md:pb-12 bg-[#f9f8f6]">
                <div className="mx-auto max-w-5xl px-6 space-y-8">
                    <motion.p
                        initial={false}
                        animate={{ opacity: 1, y: 0 }}
                        className="font-mono text-[11px] uppercase tracking-[0.28em] text-stone-500"
                    >
                        Projects
                    </motion.p>

                    <motion.h1
                        initial={false}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                        className="text-5xl sm:text-6xl md:text-7xl text-stone-900 leading-[1.05]"
                        style={serif}
                    >
                        My Work
                    </motion.h1>

                    <motion.p
                        initial={false}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-stone-600 text-lg leading-relaxed max-w-xl"
                    >
                        Technical projects across AI engineering, data science, quantitative
                        finance, and more.
                    </motion.p>

                    {/* Filter row */}
                    <motion.div
                        initial={false}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="flex flex-wrap gap-2"
                    >
                        {CATEGORIES.filter((cat) => getCount(cat) > 0).map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                aria-pressed={filter === cat}
                                onClick={() => setFilter(cat)}
                                className={`font-mono text-[11px] uppercase tracking-[0.18em] px-3 py-1.5 border transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A51C30] ${filter === cat
                                        ? "border-stone-900 bg-stone-900 text-white"
                                        : "border-stone-300 text-stone-600 hover:border-stone-900 hover:text-stone-900 bg-transparent"
                                    }`}
                            >
                                {cat}
                                <span
                                    className={`ml-2 ${filter === cat ? "text-stone-500" : "text-stone-500"
                                        }`}
                                >
                                    ({getCount(cat)})
                                </span>
                            </button>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Divider */}
            <div className="relative z-10 mx-auto w-full max-w-5xl px-6">
                <div className="h-px bg-stone-200" />
            </div>

            {/* Grid */}
            <section className="relative z-10 w-full py-12 md:py-16">
                <div className="mx-auto max-w-5xl px-6 space-y-12">
                    <motion.div layout className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                        <AnimatePresence mode="popLayout">
                            {activeProjects.map((project) => (
                                <motion.div
                                    key={project.slug}
                                    layout
                                    initial={false}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.96 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <ProjectCard project={project} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>

                    {activeProjects.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-stone-500">
                                No projects found
                            </p>
                            <button
                                onClick={() => setFilter("All")}
                                className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#A51C30] hover:text-[#7a0e1e] transition-colors"
                            >
                                Clear Filter
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}
