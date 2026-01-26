import { projects } from "@/lib/data";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/breadcrumbs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
        <main className="container mx-auto px-4 py-8 sm:px-8 space-y-8">
            <Breadcrumbs
                items={[
                    { label: "Home", href: "/" },
                    { label: "Projects", href: "/projects" },
                    { label: project.title },
                ]}
            />

            <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{project.type}</Badge>
                    {project.tags.map((tag) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight">{project.title}</h1>
            </div>



            <div className="max-w-3xl space-y-6 text-lg text-muted-foreground leading-relaxed">
                <p>{project.description}</p>

                {project.links && project.links.length > 0 && (
                    <div className="flex flex-wrap gap-4 pt-4">
                        {project.links.map((link, i) => (
                            <Button key={i} asChild variant="outline">
                                <a href={link.url} target="_blank" rel="noopener noreferrer">
                                    {link.label}
                                </a>
                            </Button>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
