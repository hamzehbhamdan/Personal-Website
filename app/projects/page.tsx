
"use client";

import { useState } from "react";

import { projects } from "@/lib/data";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function ProjectsPage() {
    const [filter, setFilter] = useState("All");

    const categories = [
        "All",
        "Finance",
        "Sports",
        "Opportunity",
        "AI",
        "ML",
        "Other",
    ];

    const matchesFilter = (projectTags: string[]) => {
        if (filter === "All") return true;
        if (filter === "Finance" && projectTags.includes("Finance")) return true;
        if (filter === "Sports" && projectTags.includes("Sports")) return true;
        if (filter === "Opportunity" && (projectTags.includes("Opportunity") || projectTags.includes("Opportunity Atlas"))) return true;
        if (filter === "AI" && projectTags.includes("AI")) return true;
        if (filter === "ML" && projectTags.includes("ML")) return true;
        if (filter === "Other" && projectTags.includes("Other")) return true;
        return false;
    };

    const activeProjects = projects.filter(p => matchesFilter(p.tags));

    return (
        <main className="container mx-auto px-4 py-8 sm:px-8 space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="space-y-4">
                    <h1 className="text-4xl font-extrabold tracking-tight">Projects</h1>
                    <p className="text-xl text-muted-foreground max-w-2xl">
                        A selection of my work in AI, Data Science, and Finance.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                        <Button
                            key={cat}
                            variant={filter === cat ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFilter(cat)}
                        >
                            {cat}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {activeProjects.map((project, i) => (
                    <Card key={i} className="hover:shadow-md transition-shadow h-full flex flex-col">
                        <CardHeader>
                            <div className="flex items-center gap-2 mb-2 overflow-hidden">
                                <Badge variant="secondary" className="text-xs whitespace-normal break-words">{project.type}</Badge>
                            </div>
                            <Link href={`/projects/${project.slug}`} className="hover:underline">
                                <CardTitle className="leading-tight">{project.title}</CardTitle>
                            </Link>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <p className="text-sm text-muted-foreground mb-4">
                                {project.description}
                            </p>
                        </CardContent>
                        <CardFooter className="flex flex-col items-start gap-4 pt-0">
                            <div className="flex flex-wrap gap-2">
                                {project.tags.map(tag => (
                                    <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                                ))}
                            </div>
                            <div className="w-full flex justify-end">
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/projects/${project.slug}`}>View Project</Link>
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </main>
    )
}
