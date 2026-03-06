
"use client"

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { projects } from "@/lib/data";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const serif = { fontFamily: "var(--font-playfair), Georgia, 'Times New Roman', serif" };

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
            <section className="relative z-10 w-full pt-20 pb-12 bg-[#f9f8f6]">
                <div className="mx-auto max-w-5xl px-6 space-y-8">
                    <motion.p
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="font-mono text-[10px] uppercase tracking-[0.28em] text-stone-400"
                    >
                        Projects
                    </motion.p>

                    <motion.h1
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                        className="text-5xl md:text-6xl text-stone-900 leading-tight"
                        style={serif}
                    >
                        My Work
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-stone-500 text-lg leading-relaxed max-w-xl"
                    >
                        Technical projects across AI engineering, data science, quantitative
                        finance, and more.
                    </motion.p>

                    {/* Filter row */}
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="flex flex-wrap gap-2"
                    >
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setFilter(cat)}
                                className={`font-mono text-[10px] uppercase tracking-[0.18em] px-3 py-1.5 border transition-all ${
                                    filter === cat
                                        ? "border-stone-900 bg-stone-900 text-white"
                                        : "border-stone-200 text-stone-400 hover:border-stone-400 hover:text-stone-700 bg-white"
                                }`}
                            >
                                {cat}
                                <span
                                    className={`ml-2 ${
                                        filter === cat ? "text-stone-400" : "text-stone-300"
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
            <section className="relative z-10 w-full py-16">
                <div className="mx-auto max-w-5xl px-6">
                    <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AnimatePresence mode="popLayout">
                            {activeProjects.map((project) => (
                                <motion.div
                                    key={project.slug}
                                    layout
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.96 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Link
                                        href={`/projects/${project.slug}`}
                                        className="group flex flex-col h-full border border-stone-200 bg-white p-6 hover:border-stone-400 transition-all space-y-4"
                                    >
                                        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400">
                                            {project.type}
                                        </p>
                                        <h2
                                            className="text-[16px] font-medium text-stone-900 leading-snug group-hover:text-[#A51C30] transition-colors min-h-[3rem] flex items-start"
                                            style={serif}
                                        >
                                            {project.title}
                                        </h2>
                                        <p className="text-[12px] text-stone-400 leading-relaxed line-clamp-4 flex-1">
                                            {project.description}
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {project.tags.slice(0, 3).map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="font-mono text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 border border-stone-100 text-stone-400 bg-stone-50"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-1.5 pt-2 border-t border-stone-100">
                                            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-400 group-hover:text-[#A51C30] transition-colors">
                                                Details
                                            </span>
                                            <ArrowRight className="h-3 w-3 text-stone-300 group-hover:text-[#A51C30] group-hover:translate-x-0.5 transition-all" />
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>

                    {activeProjects.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-400">
                                No projects found
                            </p>
                            <button
                                onClick={() => setFilter("All")}
                                className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#A51C30] hover:text-[#7a0e1e] transition-colors"
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
