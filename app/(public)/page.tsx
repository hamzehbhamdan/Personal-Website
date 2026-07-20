
"use client"

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { ArrowRight, BookOpen, Building2, Code2, ExternalLink } from "lucide-react";
import { projects, experience, education, personalInfo, harvardActivities } from "@/lib/data";
import { playgroundProjects } from "@/lib/playground";
import { HeroMotion } from "@/components/hero-motion";

const serif = { fontFamily: "var(--font-playfair), Georgia, 'Times New Roman', serif" };

const featuredTitles = [
    "Analyzing Similarity of Companies Using 10-K Filings",
    "Advanced Cryptocurrency Time Series Analysis",
    "Predicting Stock Price Variation",
    "Computer Graphics",
    "Understanding ChatGPT: Neural Networks from Scratch",
    "Baseball Analytics: Creating a Betting Edge",
];

// Only show these 4 activities, in this order, with display names
const featuredActivities = [
    "Consulting on Business and the Environment (CBE)",
    "NATO HQ Presentation",
    "Harvard Summer Camp (HMC)",
    "VeritasGPT",
];

// Display name overrides (remove acronyms / clean up names)
const activityDisplayNames: Record<string, string> = {
    "Consulting on Business and the Environment (CBE)": "Consulting on Business and the Environment",
    "NATO HQ Presentation": "NATO HQ Presentation",
    "Harvard Summer Camp (HMC)": "Harvard Summer Camp",
    "VeritasGPT": "Veritas GPT",
};

function EditorialSection({
    children,
    className = "",
    id,
}: {
    children: React.ReactNode;
    className?: string;
    id?: string;
}) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-80px" });
    return (
        <motion.section
            ref={ref}
            id={id}
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

export default function Home() {
    const featuredProjects = projects
        .filter((p) => featuredTitles.includes(p.title))
        .sort((a, b) => featuredTitles.indexOf(a.title) - featuredTitles.indexOf(b.title));

    const displayedActivities = featuredActivities
        .map((name) => harvardActivities.find((a) => a.title === name))
        .filter(Boolean) as typeof harvardActivities;

    return (
        <main className="flex flex-col min-h-screen bg-[#f9f8f6]">
            <HeroMotion />

            <Divider />

            {/* 01 — Experience */}
            <EditorialSection id="story" className="w-full py-12 md:py-20 scroll-mt-16">
                <div className="mx-auto max-w-5xl px-6 space-y-10">
                    <div className="flex items-center gap-4">
                        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-400 shrink-0">
                            01 — Experience
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
                                    <h3
                                        className="text-xl font-semibold text-stone-900"
                                        style={serif}
                                    >
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

            {/* 02 — Education */}
            <EditorialSection className="w-full py-12 md:py-20">
                <div className="mx-auto max-w-5xl px-6 space-y-10">
                    <div className="flex items-center gap-4">
                        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-400 shrink-0">
                            02 — Education
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

                    {/* Beyond the Classroom — inside Education */}
                    <div className="space-y-6">
                        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone-400">
                            Beyond the Classroom
                        </p>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {displayedActivities.map((activity, i) => (
                                <div
                                    key={i}
                                    className="border border-stone-200 bg-white p-6 hover:border-stone-300 transition-colors space-y-3"
                                >
                                    <div>
                                        <h3
                                            className="text-[15px] font-medium text-stone-900"
                                            style={serif}
                                        >
                                            {activityDisplayNames[activity.title] ?? activity.title}
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
                </div>
            </EditorialSection>

            <Divider />

            {/* 03 — Featured Work */}
            <EditorialSection className="w-full py-12 md:py-20">
                <div className="mx-auto max-w-5xl px-6 space-y-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-400 shrink-0">
                                03 — Featured Work
                            </p>
                            <div className="hidden sm:block h-px w-12 bg-stone-200" />
                        </div>
                        <Link
                            href="/projects"
                            className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400 hover:text-stone-700 transition-colors flex items-center gap-1.5 shrink-0"
                        >
                            All Projects <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {featuredProjects.map((project, i) => (
                            <Link
                                key={i}
                                href={`/projects/${project.slug}`}
                                className="group flex flex-col border border-stone-200 bg-white p-5 hover:border-stone-400 transition-all space-y-3"
                            >
                                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-stone-400">
                                    {project.type}
                                </p>
                                <h3
                                    className="text-[15px] font-medium text-stone-900 leading-snug group-hover:text-[#A51C30] transition-colors"
                                    style={serif}
                                >
                                    {project.title}
                                </h3>
                                <p className="text-[12px] text-stone-400 leading-relaxed line-clamp-3 flex-1">
                                    {project.description}
                                </p>
                                <div className="flex items-center gap-1.5 pt-2 border-t border-stone-100">
                                    <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-400 group-hover:text-[#A51C30] transition-colors">
                                        View Details
                                    </span>
                                    <ArrowRight className="h-3 w-3 text-stone-300 group-hover:text-[#A51C30] group-hover:translate-x-0.5 transition-all" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </EditorialSection>

            <Divider />

            {/* 05 — Playground */}
            <EditorialSection className="w-full py-12 md:py-20">
                <div className="mx-auto max-w-5xl px-6 space-y-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-400 shrink-0">
                                04 — Playground
                            </p>
                            <div className="hidden sm:block h-px w-12 bg-stone-200" />
                        </div>
                        <Link
                            href="/playground"
                            className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400 hover:text-stone-700 transition-colors flex items-center gap-1.5 shrink-0"
                        >
                            All Experiments <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {playgroundProjects.map((project, i) => (
                            <a
                                key={i}
                                href={project.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex flex-col border border-stone-200 bg-white p-5 hover:border-stone-400 transition-all space-y-3"
                            >
                                <div className="flex flex-wrap gap-1.5">
                                    {project.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-400"
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <h3
                                    className="text-[15px] font-medium text-stone-900 leading-snug group-hover:text-[#A51C30] transition-colors"
                                    style={serif}
                                >
                                    {project.title}
                                </h3>
                                <p className="text-[12px] text-stone-400 leading-relaxed line-clamp-3 flex-1">
                                    {project.description}
                                </p>
                                <div className="flex items-center gap-1.5 pt-2 border-t border-stone-100">
                                    <ExternalLink className="h-3 w-3 text-stone-300 group-hover:text-[#A51C30] transition-colors" />
                                    <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-stone-400 group-hover:text-[#A51C30] transition-colors">
                                        Launch Demo
                                    </span>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </EditorialSection>

            {/* 06 — Consulting CTA (dark) */}
            <section className="w-full bg-stone-900 py-12 md:py-20">
                <div className="mx-auto max-w-5xl px-6">
                    <div className="grid md:grid-cols-[1fr_auto] gap-12 items-start">
                        <div className="space-y-6">
                            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-500">
                                05 — AI Consulting
                            </p>
                            <h2
                                className="text-3xl sm:text-4xl md:text-5xl text-white leading-tight"
                                style={serif}
                            >
                                Work With Me
                            </h2>
                            <p className="text-stone-400 leading-relaxed max-w-lg">
                                Whether you&apos;re an individual getting started with AI or an organization
                                building the right adoption strategy — I can help.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                                {[
                                    { icon: BookOpen, label: "Personal Training", rate: "$200 / hr" },
                                    { icon: Building2, label: "Corporate Adoption", rate: "Package" },
                                    { icon: Code2, label: "Custom AI Builds", rate: "Project-Based" },
                                ].map((item, i) => (
                                    <div
                                        key={i}
                                        className="border border-stone-700 p-4 space-y-2 hover:border-stone-500 transition-colors"
                                    >
                                        <item.icon className="h-4 w-4 text-stone-500" />
                                        <p className="text-sm text-stone-300 font-medium">{item.label}</p>
                                        <p className="font-mono text-[10px] text-stone-500">{item.rate}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 shrink-0 w-full md:w-auto">
                            <Link
                                href="/consulting"
                                className="inline-flex items-center justify-center gap-2 bg-white text-stone-900 text-sm font-medium px-6 py-3 hover:bg-stone-100 transition-colors whitespace-nowrap"
                            >
                                See How It Works <ArrowRight className="h-4 w-4" />
                            </Link>
                            <a
                                href={`mailto:${personalInfo.email}`}
                                className="inline-flex items-center justify-center gap-2 border border-stone-600 text-stone-300 text-sm font-medium px-6 py-3 hover:border-stone-400 hover:text-white transition-colors whitespace-nowrap"
                            >
                                Book Intro Call
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
