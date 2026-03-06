
"use client"

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { personalInfo, education, experience, harvardActivities } from "@/lib/data";

const serif = { fontFamily: "var(--font-playfair), Georgia, 'Times New Roman', serif" };

function EditorialSection({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-80px" });
    return (
        <motion.section
            ref={ref}
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className={className}
        >
            {children}
        </motion.section>
    );
}

function Divider() {
    return (
        <div className="mx-auto w-full max-w-5xl px-6">
            <div className="h-px bg-stone-200" />
        </div>
    );
}

export default function AboutPage() {
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

            {/* Hero */}
            <section className="relative w-full pt-20 pb-24 md:pt-28 md:pb-32 bg-[#f9f8f6]">
                <div className="relative z-10 mx-auto max-w-5xl px-6">
                    <motion.p
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="font-mono text-[10px] uppercase tracking-[0.28em] text-stone-400 mb-10"
                    >
                        About
                    </motion.p>

                    <div className="grid lg:grid-cols-[1fr_360px] gap-12 lg:gap-16 items-start">
                        <div className="space-y-8">
                            <motion.h1
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.65, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                                className="text-5xl md:text-6xl leading-[1.05] text-stone-900"
                                style={serif}
                            >
                                Bridging AI
                                <br />
                                <em className="not-italic text-[#A51C30]">&amp; Reality</em>
                            </motion.h1>

                            <motion.p
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.12 }}
                                className="text-stone-500 text-lg leading-relaxed max-w-xl"
                            >
                                {personalInfo.fullBio}
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="flex flex-wrap gap-3"
                            >
                                <Link
                                    href="/contact"
                                    className="inline-flex items-center gap-2 bg-stone-900 text-white text-sm font-medium px-5 py-2.5 hover:bg-stone-800 transition-colors"
                                >
                                    Get in Touch
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                <a
                                    href={personalInfo.resume}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 border border-stone-300 text-stone-700 text-sm font-medium px-5 py-2.5 hover:border-stone-500 hover:text-stone-900 transition-colors"
                                >
                                    <FileText className="h-4 w-4" /> Resume
                                </a>
                            </motion.div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                            className="mx-auto lg:mx-0 shrink-0 w-[300px] lg:w-full"
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

            <Divider />

            {/* 01 — My Journey */}
            <EditorialSection className="relative z-10 w-full py-20">
                <div className="mx-auto max-w-5xl px-6 space-y-10">
                    <div className="flex items-center gap-4">
                        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-400 shrink-0">
                            01 — My Journey
                        </p>
                        <div className="flex-1 h-px bg-stone-200" />
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                num: "01",
                                title: "The Spark",
                                content:
                                    "My passion for AI ignited during my first semester at Harvard, when I gained early access to ChatGPT. This shifted my focus from pure mathematics to the intersection of statistics and computer science.",
                            },
                            {
                                num: "02",
                                title: "Impact Focused",
                                content:
                                    "At Cresset Capital, I build the AI infrastructure behind enterprise-wide adoption — from intelligent agent systems to compliance and usage monitoring. My focus is turning research-grade AI into tools that organizations can actually rely on.",
                            },
                            {
                                num: "03",
                                title: "Teaching & Consulting",
                                content:
                                    "Outside my day job, I teach AI to people who want to actually use it. From Harvard summer programs to global workshops in Turkey and the UAE, and now one-on-one consulting — helping individuals and teams build real, lasting habits with AI.",
                            },
                        ].map((item) => (
                            <div
                                key={item.num}
                                className="border-t border-stone-200 pt-6 space-y-3"
                            >
                                <p className="font-mono text-[10px] text-stone-300">{item.num}</p>
                                <h3 className="text-xl text-stone-900" style={serif}>
                                    {item.title}
                                </h3>
                                <p className="text-[13px] text-stone-500 leading-relaxed">
                                    {item.content}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </EditorialSection>

            <Divider />

            {/* 02 — Work Experience */}
            <EditorialSection className="relative z-10 w-full py-20">
                <div className="mx-auto max-w-5xl px-6 space-y-10">
                    <div className="flex items-center gap-4">
                        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-400 shrink-0">
                            02 — Work Experience
                        </p>
                        <div className="flex-1 h-px bg-stone-200" />
                    </div>
                    <div className="space-y-10">
                        {experience.map((exp, i) => (
                            <div
                                key={i}
                                className="grid md:grid-cols-[180px_1fr] gap-4 md:gap-8 border-b border-stone-100 pb-10 last:border-0 last:pb-0"
                            >
                                <div className="space-y-1">
                                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400">
                                        {exp.date}
                                    </p>
                                    <p className="text-[13px] font-medium text-stone-600">{exp.company}</p>
                                    <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-300">
                                        {exp.location}
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-xl font-semibold text-stone-900" style={serif}>
                                        {exp.role}
                                    </h3>
                                    <p className="text-[13px] text-stone-500 leading-relaxed">
                                        {exp.description}
                                    </p>
                                    <ul className="space-y-2">
                                        {exp.details.map((detail, j) => (
                                            <li
                                                key={j}
                                                className="text-[13px] text-stone-400 leading-relaxed flex gap-3"
                                            >
                                                <span className="text-[#A51C30] shrink-0 mt-0.5">—</span>
                                                {detail}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </EditorialSection>

            <Divider />

            {/* 03 — Education */}
            <EditorialSection className="relative z-10 w-full py-20">
                <div className="mx-auto max-w-5xl px-6 space-y-10">
                    <div className="flex items-center gap-4">
                        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-400 shrink-0">
                            03 — Education
                        </p>
                        <div className="flex-1 h-px bg-stone-200" />
                    </div>

                    <div className="grid lg:grid-cols-[1fr_2fr] gap-12 items-start">
                        <div className="space-y-4">
                            <h2 className="text-3xl text-stone-900 leading-snug" style={serif}>
                                Harvard
                                <br />
                                University
                            </h2>
                            <p className="text-[13px] text-stone-500 leading-relaxed">
                                {education.degree}
                            </p>
                            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">
                                {education.date}
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-5">
                            <div className="border border-stone-200 bg-white p-5 space-y-3">
                                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-400">
                                    Computer Science
                                </p>
                                <ul className="space-y-2">
                                    {education.courses.cs.map((c, i) => (
                                        <li key={i} className="text-[12px] text-stone-500 leading-relaxed">
                                            {c.split("(")[0].trim()}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="border border-stone-200 bg-white p-5 space-y-3">
                                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-400">
                                    Stats &amp; Math
                                </p>
                                <ul className="space-y-2">
                                    {[...education.courses.stats, ...education.courses.math]
                                        .slice(0, 6)
                                        .map((c, i) => (
                                            <li key={i} className="text-[12px] text-stone-500 leading-relaxed">
                                                {c.split("(")[0].trim()}
                                            </li>
                                        ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Thesis card */}
                    <div className="border border-[#A51C30]/22 bg-white p-8 space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#A51C30]">
                                Senior Thesis
                            </p>
                            <Link
                                href="/thesis"
                                className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#A51C30] hover:text-[#7a0e1e] transition-colors"
                            >
                                View Interactive Thesis <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>
                        <h3 className="text-2xl text-stone-900" style={serif}>
                            {education.thesis.title}
                        </h3>
                        <p className="text-[13px] text-stone-500 leading-relaxed max-w-3xl">
                            {education.thesis.description}
                        </p>
                    </div>
                </div>
            </EditorialSection>

            <Divider />

            {/* 04 — Beyond the Code */}
            <EditorialSection className="relative z-10 w-full py-20">
                <div className="mx-auto max-w-5xl px-6 space-y-10">
                    <div className="flex items-center gap-4">
                        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-400 shrink-0">
                            04 — Beyond the Code
                        </p>
                        <div className="flex-1 h-px bg-stone-200" />
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {harvardActivities.slice(0, 6).map((activity, i) => (
                            <div
                                key={i}
                                className="border border-stone-200 bg-white p-6 hover:border-stone-300 transition-colors space-y-3"
                            >
                                <div>
                                    <h3
                                        className="text-[15px] font-medium text-stone-900"
                                        style={serif}
                                    >
                                        {activity.title}
                                    </h3>
                                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#A51C30] mt-0.5">
                                        {activity.role}
                                    </p>
                                </div>
                                <ul className="space-y-1.5">
                                    {activity.details.map((detail, j) => (
                                        <li
                                            key={j}
                                            className="text-[12px] text-stone-400 leading-relaxed flex gap-2"
                                        >
                                            <span className="text-stone-300 shrink-0">—</span>
                                            {detail}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </EditorialSection>
        </main>
    );
}
