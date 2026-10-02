"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Building2, ChevronDown, Code2, ExternalLink } from "lucide-react";
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

// How many roles show before the "show earlier roles" button.
const VISIBLE_ROLES = 2;

function SectionHeader({
    n,
    title,
    href,
    hrefLabel,
}: {
    n: string;
    title: string;
    href?: string;
    hrefLabel?: string;
}) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-stone-500 shrink-0">{n}</p>
                <div className="flex-1 h-px bg-stone-200" />
                {href && hrefLabel && (
                    <Link
                        href={href}
                        className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-600 hover:text-[#A51C30] transition-colors flex items-center gap-1.5 shrink-0"
                    >
                        {hrefLabel} <ArrowRight className="h-3 w-3" />
                    </Link>
                )}
            </div>
            <h2 className="text-3xl md:text-4xl text-stone-900 leading-tight" style={serif}>
                {title}
            </h2>
        </div>
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
    const [showAllRoles, setShowAllRoles] = useState(false);

    const featuredProjects = projects
        .filter((p) => featuredTitles.includes(p.title))
        .sort((a, b) => featuredTitles.indexOf(a.title) - featuredTitles.indexOf(b.title));

    const displayedActivities = featuredActivities
        .map((name) => harvardActivities.find((a) => a.title === name))
        .filter(Boolean) as typeof harvardActivities;

    const visibleRoles = showAllRoles ? experience : experience.slice(0, VISIBLE_ROLES);
    const hiddenRoles = experience.length - VISIBLE_ROLES;

    return (
        <main className="flex flex-col min-h-screen bg-[#f9f8f6]">
            <HeroMotion />

            <Divider />

            {/* 01 — Experience */}
            <section id="story" className="w-full py-14 md:py-20 scroll-mt-16">
                <div className="mx-auto max-w-5xl px-6 space-y-10">
                    <SectionHeader n="01" title="Experience" />
                    <div className="space-y-10">
                        {visibleRoles.map((exp) => (
                            <div
                                key={`${exp.company}-${exp.date}`}
                                className="grid md:grid-cols-[200px_1fr] gap-4 md:gap-8 border-b border-stone-200 pb-10 last:border-0 last:pb-0"
                            >
                                <div className="space-y-1">
                                    <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-stone-500">
                                        {exp.date}
                                    </p>
                                    <p className="text-[15px] font-medium text-stone-800">{exp.company}</p>
                                    <p className="font-mono text-[11px] text-stone-500">{exp.location}</p>
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-xl md:text-2xl font-semibold text-stone-900" style={serif}>
                                        {exp.role}
                                    </h3>
                                    <p className="text-[15px] text-stone-600 leading-relaxed">{exp.description}</p>
                                    <ul className="space-y-2">
                                        {exp.details.map((detail, j) => (
                                            <li
                                                key={j}
                                                className="text-[15px] text-stone-600 leading-relaxed flex gap-3"
                                            >
                                                <span className="text-[#A51C30] shrink-0">—</span>
                                                {detail}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                    {hiddenRoles > 0 && (
                        <button
                            type="button"
                            onClick={() => setShowAllRoles((v) => !v)}
                            aria-expanded={showAllRoles}
                            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-700 border border-stone-300 px-4 py-2 hover:border-stone-900 hover:text-stone-900 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A51C30]"
                        >
                            {showAllRoles ? "Show fewer roles" : `Show earlier roles (${hiddenRoles})`}
                            <ChevronDown
                                className={`h-3 w-3 transition-transform ${showAllRoles ? "rotate-180" : ""}`}
                            />
                        </button>
                    )}
                </div>
            </section>

            <Divider />

            {/* 02 — Harvard (education + thesis) */}
            <section className="w-full py-14 md:py-20">
                <div className="mx-auto max-w-5xl px-6 space-y-10">
                    <SectionHeader n="02" title="Harvard University" />

                    <div className="space-y-1">
                        <p className="text-[15px] text-stone-600">{education.degree}</p>
                        <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-stone-500">
                            {education.date}
                        </p>
                    </div>

                    {/* Senior thesis */}
                    <div className="border-l-2 border-[#A51C30] pl-6 md:pl-8 space-y-4 max-w-3xl">
                        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#A51C30]">
                            Senior thesis
                        </p>
                        <h3 className="text-2xl md:text-3xl text-stone-900 leading-snug" style={serif}>
                            {education.thesis.title}
                        </h3>
                        <p className="text-[15px] md:text-base text-stone-600 leading-relaxed">
                            {education.thesis.description}
                        </p>
                        <Link
                            href="/thesis"
                            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[#A51C30] hover:text-[#7a0e1e] transition-colors"
                        >
                            View interactive thesis <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>

                    {/* Courses & activities (collapsed) */}
                    <details className="group border-t border-b border-stone-300">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 [&::-webkit-details-marker]:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A51C30]">
                            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-700">
                                Courses &amp; activities
                            </span>
                            <ChevronDown className="h-3 w-3 text-stone-700 transition-transform group-open:rotate-180" />
                        </summary>

                        <div className="space-y-10 pb-8 pt-2">
                            <div className="grid sm:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-500">
                                        Computer Science
                                    </p>
                                    <ul className="space-y-1.5">
                                        {education.courses.cs.map((c, i) => (
                                            <li key={i} className="text-[14px] text-stone-600 leading-relaxed">
                                                {c.split("(")[0].trim()}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="space-y-3">
                                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-500">
                                        Stats &amp; Math
                                    </p>
                                    <ul className="space-y-1.5">
                                        {[...education.courses.stats, ...education.courses.math]
                                            .slice(0, 6)
                                            .map((c, i) => (
                                                <li key={i} className="text-[14px] text-stone-600 leading-relaxed">
                                                    {c.split("(")[0].trim()}
                                                </li>
                                            ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-500">
                                    Beyond the classroom
                                </p>
                                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
                                    {displayedActivities.map((activity) => (
                                        <div key={activity.title} className="border-t border-stone-300 pt-4 space-y-2">
                                            <h3 className="text-[16px] font-medium text-stone-900" style={serif}>
                                                {activityDisplayNames[activity.title] ?? activity.title}
                                            </h3>
                                            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#A51C30]">
                                                {activity.role}
                                            </p>
                                            <ul className="space-y-1.5">
                                                {activity.details.map((detail, j) => (
                                                    <li
                                                        key={j}
                                                        className="text-[14px] text-stone-600 leading-relaxed flex gap-2"
                                                    >
                                                        <span className="text-stone-500 shrink-0">—</span>
                                                        {detail}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </details>
                </div>
            </section>

            <Divider />

            {/* 03 — Featured Work */}
            <section className="w-full py-14 md:py-20">
                <div className="mx-auto max-w-5xl px-6 space-y-10">
                    <SectionHeader n="03" title="Featured Work" href="/projects" hrefLabel="All projects" />
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
                        {featuredProjects.map((project) => (
                            <Link
                                key={project.slug}
                                href={`/projects/${project.slug}`}
                                className="group flex flex-col border-t border-stone-300 hover:border-stone-900 transition-colors pt-5 space-y-3"
                            >
                                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-500">
                                    {project.type}
                                </p>
                                <h3
                                    className="text-lg text-stone-900 leading-snug group-hover:text-[#A51C30] transition-colors"
                                    style={serif}
                                >
                                    {project.title}
                                </h3>
                                <p className="text-[14px] text-stone-600 leading-relaxed line-clamp-3 flex-1">
                                    {project.description}
                                </p>
                                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-stone-600 group-hover:text-[#A51C30] transition-colors">
                                    View details
                                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <Divider />

            {/* 04 — Playground */}
            <section className="w-full py-14 md:py-20">
                <div className="mx-auto max-w-5xl px-6 space-y-10">
                    <SectionHeader n="04" title="Playground" href="/playground" hrefLabel="All experiments" />
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
                        {playgroundProjects.map((project) => (
                            <a
                                key={project.slug}
                                href={project.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex flex-col border-t border-stone-300 hover:border-stone-900 transition-colors pt-5 space-y-3"
                            >
                                <p className="font-mono text-[11px] text-stone-500">{project.tags.join(" · ")}</p>
                                <h3
                                    className="text-lg text-stone-900 leading-snug group-hover:text-[#A51C30] transition-colors"
                                    style={serif}
                                >
                                    {project.title}
                                </h3>
                                <p className="text-[14px] text-stone-600 leading-relaxed line-clamp-3 flex-1">
                                    {project.description}
                                </p>
                                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-stone-600 group-hover:text-[#A51C30] transition-colors">
                                    <ExternalLink className="h-3 w-3" />
                                    Launch demo
                                </span>
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            {/* 05 — Consulting CTA (dark) */}
            <section className="w-full bg-stone-900 py-14 md:py-20">
                <div className="mx-auto max-w-5xl px-6">
                    <div className="grid md:grid-cols-[1fr_auto] gap-12 items-start">
                        <div className="space-y-6">
                            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-stone-400">
                                05
                            </p>
                            <h2
                                className="text-4xl md:text-5xl text-white leading-tight"
                                style={serif}
                            >
                                Work With Me
                            </h2>
                            <p className="text-stone-300 text-base leading-relaxed max-w-lg">
                                Whether you&apos;re an individual getting started with AI or an organization
                                building the right adoption strategy, I can help.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                                {[
                                    { icon: BookOpen, label: "Personal Training", rate: "$350 / hr" },
                                    { icon: Building2, label: "Corporate Adoption", rate: "Package" },
                                    { icon: Code2, label: "Custom AI Builds", rate: "Project-Based" },
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        className="border border-stone-700 p-4 space-y-2 hover:border-stone-500 transition-colors"
                                    >
                                        <item.icon className="h-4 w-4 text-stone-400" />
                                        <p className="text-sm text-stone-200 font-medium">{item.label}</p>
                                        <p className="font-mono text-[11px] text-stone-400">{item.rate}</p>
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
                                className="inline-flex items-center justify-center gap-2 border border-stone-500 text-stone-200 text-sm font-medium px-6 py-3 hover:border-stone-300 hover:text-white transition-colors whitespace-nowrap"
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
