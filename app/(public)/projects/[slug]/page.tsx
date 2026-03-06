
import { projects } from "@/lib/data";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

const serif = { fontFamily: "var(--font-playfair), Georgia, 'Times New Roman', serif" };

interface ProjectPageProps {
    params: Promise<{
        slug: string;
    }>;
}

export async function generateStaticParams() {
    return projects.map((project) => ({
        slug: project.slug,
    }));
}

export default async function ProjectPage({ params }: ProjectPageProps) {
    const { slug } = await params;
    const project = projects.find((p) => p.slug === slug);

    if (!project) {
        notFound();
    }

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
            <section className="relative z-10 w-full pt-16 pb-14 bg-[#f9f8f6]">
                <div className="mx-auto max-w-5xl px-6 space-y-8">
                    {/* Back link */}
                    <Link
                        href="/projects"
                        className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-stone-400 hover:text-stone-700 transition-colors"
                    >
                        <ArrowLeft className="h-3 w-3" />
                        Back to Projects
                    </Link>

                    {/* Type label */}
                    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-stone-400">
                        {project.type}
                    </p>

                    {/* Title */}
                    <h1
                        className="text-4xl md:text-6xl text-stone-900 leading-tight max-w-3xl"
                        style={serif}
                    >
                        {project.title}
                    </h1>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                        {project.tags.map((tag) => (
                            <span
                                key={tag}
                                className="font-mono text-[9px] uppercase tracking-[0.18em] px-2.5 py-1 border border-stone-200 text-stone-400 bg-white"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Divider */}
            <div className="relative z-10 mx-auto w-full max-w-5xl px-6">
                <div className="h-px bg-stone-200" />
            </div>

            {/* Body */}
            <section className="relative z-10 w-full py-16">
                <div className="mx-auto max-w-5xl px-6">
                    <div className="grid lg:grid-cols-[1fr_260px] gap-12 lg:gap-20">

                        {/* Description */}
                        <div className="space-y-6">
                            <p className="text-stone-600 text-lg leading-relaxed">
                                {project.description}
                            </p>
                        </div>

                        {/* Sidebar: links */}
                        {project.links && project.links.length > 0 && (
                            <aside className="space-y-4">
                                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-stone-400">
                                    Links
                                </p>
                                <div className="flex flex-col gap-2">
                                    {project.links.map((link, i) => (
                                        <a
                                            key={i}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-600 hover:border-stone-400 hover:text-stone-900 transition-all"
                                        >
                                            <ExternalLink className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                                            {link.label}
                                        </a>
                                    ))}
                                </div>
                            </aside>
                        )}
                    </div>
                </div>
            </section>

            {/* Bottom nav */}
            <div className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-16">
                <div className="h-px bg-stone-200 mb-8" />
                <Link
                    href="/projects"
                    className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-stone-400 hover:text-stone-700 transition-colors"
                >
                    <ArrowLeft className="h-3 w-3" />
                    All Projects
                </Link>
            </div>
        </main>
    );
}
