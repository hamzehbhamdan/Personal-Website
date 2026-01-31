
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { projects } from "@/lib/data";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, BarChart3, Trophy, Lightbulb, ArrowRight, Search } from "lucide-react";
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
        "AI",
        "ML",
        "Data Science",
        "Other",
    ];

    const getCount = (cat: string) => {
        if (cat === "All") return projects.length;
        return projects.filter(p => {
            if (cat === "Data Science") return p.tags.includes("Data Science") || p.tags.includes("Statistics");
            return p.tags.includes(cat);
        }).length;
    };

    const matchesFilter = (projectTags: string[]) => {
        if (filter === "All") return true;
        if (filter === "Data Science") return projectTags.includes("Data Science") || projectTags.includes("Statistics");
        return projectTags.includes(filter);
    };

    const activeProjects = projects.filter(p => matchesFilter(p.tags));

    const getProjectIcon = (type: string) => {
        const t = type.toLowerCase();
        if (t.includes("ai") || t.includes("neural") || t.includes("nlp")) return <Brain className="h-5 w-5 text-purple-500" />;
        if (t.includes("finance") || t.includes("financial")) return <TrendingUp className="h-5 w-5 text-green-500" />;
        if (t.includes("data science") || t.includes("statistics")) return <BarChart3 className="h-5 w-5 text-blue-500" />;
        if (t.includes("sports")) return <Trophy className="h-5 w-5 text-amber-500" />;
        return <Lightbulb className="h-5 w-5 text-slate-400" />;
    };

    return (
        <main className="container mx-auto px-4 py-16 sm:px-8 space-y-12">
            <div className="flex flex-col space-y-8">
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter">
                        My Projects
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
                        A deep dive into my work at the intersection of quantitative finance and artificial intelligence.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2 p-1 bg-slate-100 dark:bg-slate-900/50 rounded-2xl w-fit">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`
                                px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2
                                ${filter === cat
                                    ? "bg-background text-primary shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"}
                            `}
                        >
                            {cat}
                            <span className={`
                                text-[10px] px-1.5 py-0.5 rounded-full
                                ${filter === cat ? "bg-primary/10 text-primary" : "bg-slate-200 dark:bg-slate-800 text-muted-foreground"}
                            `}>
                                {getCount(cat)}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <motion.div
                layout
                className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
            >
                <AnimatePresence mode="popLayout">
                    {activeProjects.map((project) => (
                        <motion.div
                            key={project.slug}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Card className="group h-full border-none shadow-none bg-slate-50/50 dark:bg-slate-950/20 hover:bg-background transition-all duration-500 rounded-3xl overflow-hidden flex flex-col border border-transparent hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5">
                                <CardHeader className="p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] uppercase tracking-widest px-2 py-0.5">
                                            {project.type}
                                        </Badge>
                                        <div className="p-2 rounded-xl bg-background shadow-sm">
                                            {getProjectIcon(project.type)}
                                        </div>
                                    </div>
                                    <Link href={`/projects/${project.slug}`}>
                                        <CardTitle className="text-2xl leading-tight group-hover:text-primary transition-colors duration-300 min-h-[4rem] flex items-center">
                                            {project.title}
                                        </CardTitle>
                                    </Link>
                                </CardHeader>
                                <CardContent className="px-6 flex-1">
                                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-4">
                                        {project.description}
                                    </p>
                                </CardContent>
                                <CardFooter className="p-6 flex flex-col items-start gap-6">
                                    <div className="flex flex-wrap gap-2">
                                        {project.tags.map(tag => (
                                            <span key={tag} className="text-[10px] font-bold uppercase tracking-wider text-primary/60 bg-primary/5 px-2 py-1 rounded-md">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="w-full flex justify-end pt-4 border-t border-primary/5">
                                        <Button variant="ghost" size="sm" className="group/btn" asChild>
                                            <Link href={`/projects/${project.slug}`} className="font-bold flex items-center gap-2">
                                                Explore <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                                            </Link>
                                        </Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            {activeProjects.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800">
                        <Search className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-xl font-medium">No projects found in this category.</p>
                    <Button variant="link" onClick={() => setFilter("All")}>Clear all filters</Button>
                </div>
            )}
        </main>
    )
}
