
"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, FileText, Linkedin, Github } from "lucide-react"
import { personalInfo } from "@/lib/data"

const serif = { fontFamily: "var(--font-playfair), Georgia, 'Times New Roman', serif" }

export function HeroMotion() {
    return (
        <section className="relative w-full bg-[#f9f8f6] pt-16 pb-16 md:pt-28 md:pb-32 overflow-hidden">
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

            <div className="relative z-10 mx-auto max-w-5xl px-6">
                {/* Eyebrow label */}
                <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="font-mono text-[10px] uppercase tracking-[0.28em] text-stone-400 mb-10"
                >
                    Portfolio · 2026
                </motion.p>

                <div className="grid lg:grid-cols-[1fr_380px] gap-8 lg:gap-16 items-start">
                    {/* Text block */}
                    <div className="space-y-8">
                        <motion.h1
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.65, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                            className="text-4xl sm:text-5xl md:text-7xl leading-[1.05] text-stone-900"
                            style={serif}
                        >
                            Hi, I&apos;m Hamzeh.
                            <br />
                            <em className="not-italic text-[#A51C30]">Building AI</em>
                            <br />
                            That Works.
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.12 }}
                            className="text-stone-500 text-base sm:text-lg leading-relaxed max-w-lg"
                        >
                            {personalInfo.bio}
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="flex flex-wrap gap-3"
                        >
                            <Link
                                href="/projects"
                                className="inline-flex items-center gap-2 bg-stone-900 text-white text-sm font-medium px-5 py-2.5 hover:bg-stone-800 transition-colors"
                            >
                                View Projects
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                            <Link
                                href="/#story"
                                className="inline-flex items-center gap-2 border border-stone-300 text-stone-700 text-sm font-medium px-5 py-2.5 hover:border-stone-500 hover:text-stone-900 transition-colors"
                            >
                                The Story
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.32 }}
                            className="flex items-center gap-5 sm:gap-6 pt-1 flex-wrap"
                        >
                            <a
                                href={personalInfo.linkedin}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400 hover:text-stone-700 transition-colors"
                            >
                                <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                            </a>
                            <a
                                href={personalInfo.github}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400 hover:text-stone-700 transition-colors"
                            >
                                <Github className="h-3.5 w-3.5" /> GitHub
                            </a>
                            <a
                                href={personalInfo.resume}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400 hover:text-stone-700 transition-colors"
                            >
                                <FileText className="h-3.5 w-3.5" /> Resume
                            </a>
                        </motion.div>
                    </div>

                    {/* Portrait */}
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                        className="mx-auto lg:mx-0 shrink-0 w-[260px] sm:w-[300px] lg:w-full"
                    >
                        <div className="relative aspect-[5/6] overflow-hidden border border-stone-200 bg-stone-100">
                            <Image
                                src="/portrait.png"
                                alt="Hamzeh Hamdan"
                                fill
                                className="object-cover object-[10%_center]"
                                priority
                            />
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}
