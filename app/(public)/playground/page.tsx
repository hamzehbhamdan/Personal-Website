
"use client"

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { playgroundProjects } from "@/lib/playground";

const serif = { fontFamily: "var(--font-playfair), Georgia, 'Times New Roman', serif" };

export default function PlaygroundPage() {
    const headerRef = useRef(null);
    const gridRef = useRef(null);
    const headerInView = useInView(headerRef, { once: true });
    const gridInView = useInView(gridRef, { once: true, margin: "-60px" });

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
            <section className="relative z-10 w-full pt-16 pb-10 md:pb-14 bg-[#f9f8f6]">
                <div className="mx-auto max-w-5xl px-6 space-y-8">
                    <motion.div
                        ref={headerRef}
                        initial={{ opacity: 0, y: 12 }}
                        animate={headerInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="space-y-6"
                    >
                        <div className="flex items-center gap-4">
                            <Link
                                href="/"
                                className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400 hover:text-stone-600 transition-colors"
                            >
                                Home
                            </Link>
                            <span className="text-stone-300 font-mono text-[10px]">/</span>
                            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-500">
                                Playground
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h1
                                className="text-4xl sm:text-5xl md:text-6xl text-stone-900 leading-none"
                                style={serif}
                            >
                                Playground
                            </h1>
                            <p className="text-[14px] text-stone-500 leading-relaxed max-w-xl">
                                Interactive experiments and visualizations — things built for the joy of building.
                                Each one is a live demo you can play with directly in the browser.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>

            <div className="mx-auto w-full max-w-5xl px-6">
                <div className="h-px bg-stone-200" />
            </div>

            {/* Grid */}
            <section className="relative z-10 w-full py-12 md:py-16">
                <motion.div
                    ref={gridRef}
                    initial={{ opacity: 0, y: 20 }}
                    animate={gridInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                    className="mx-auto max-w-5xl px-6"
                >
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {playgroundProjects.map((project, i) => (
                            <motion.div
                                key={project.slug}
                                initial={{ opacity: 0, y: 16 }}
                                animate={gridInView ? { opacity: 1, y: 0 } : {}}
                                transition={{
                                    duration: 0.5,
                                    delay: i * 0.08,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                                className="flex flex-col border border-stone-200 bg-white hover:border-stone-400 transition-all"
                            >
                                {/* Tags row + date */}
                                <div className="flex items-center justify-between px-5 pt-5">
                                    <div className="flex flex-wrap gap-1.5">
                                        {project.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-400 bg-stone-50 border border-stone-100 px-1.5 py-0.5"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                    <span className="font-mono text-[9px] text-stone-300">{project.date}</span>
                                </div>

                                {/* Title */}
                                <div className="px-5 pt-4 pb-2">
                                    <h2
                                        className="text-[17px] font-medium text-stone-900 leading-snug"
                                        style={serif}
                                    >
                                        {project.title}
                                    </h2>
                                </div>

                                {/* Description */}
                                <p className="px-5 pb-4 text-[12px] text-stone-400 leading-relaxed flex-1">
                                    {project.description}
                                </p>

                                {/* CTA row — always Launch Demo, optionally also blog link */}
                                <div className="border-t border-stone-100 divide-x divide-stone-100 flex">
                                    <a
                                        href={project.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex flex-1 items-center gap-1.5 px-4 py-3 hover:bg-stone-50 transition-colors"
                                    >
                                        <ExternalLink className="h-3 w-3 text-stone-300 group-hover:text-[#A51C30] transition-colors" />
                                        <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-400 group-hover:text-[#A51C30] transition-colors">
                                            Launch Demo
                                        </span>
                                    </a>
                                    {project.blogSlug && (
                                        <Link
                                            href={`/blog/${project.blogSlug}`}
                                            className="group flex items-center gap-1.5 px-4 py-3 hover:bg-stone-50 transition-colors"
                                        >
                                            <ArrowRight className="h-3 w-3 text-stone-300 group-hover:text-stone-600 transition-colors" />
                                            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-400 group-hover:text-stone-600 transition-colors">
                                                Read write-up
                                            </span>
                                        </Link>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </section>
        </main>
    );
}
