
import Link from "next/link";
import { ArrowRight, Brain, TrendingUp, BarChart3, Trophy, Lightbulb, GraduationCap, Briefcase } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { projects, experience, education } from "@/lib/data";
import { HeroMotion } from "@/components/hero-motion";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  // Filter for specific featured projects by exact title match
  const featuredTitles = [
    "Analyzing Similarity of Companies Using 10-K Filings",
    "Advanced Cryptocurrency Time Series Analysis",
    "Predicting Stock Price Variation",
    "Computer Graphics",
    "Understanding ChatGPT: Neural Networks from Scratch",
    "Baseball Analytics: Creating a Betting Edge"
  ];

  const featuredProjects = projects.filter(p => featuredTitles.includes(p.title));
  // Sort them based on the manual list order
  featuredProjects.sort((a, b) => featuredTitles.indexOf(a.title) - featuredTitles.indexOf(b.title));

  const getProjectIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("ai") || t.includes("neural") || t.includes("nlp")) return <Brain className="h-5 w-5 text-purple-500" />;
    if (t.includes("finance") || t.includes("financial")) return <TrendingUp className="h-5 w-5 text-green-500" />;
    if (t.includes("data science") || t.includes("statistics")) return <BarChart3 className="h-5 w-5 text-blue-500" />;
    if (t.includes("sports")) return <Trophy className="h-5 w-5 text-amber-500" />;
    return <Lightbulb className="h-5 w-5 text-slate-400" />;
  };

  return (
    <main className="flex flex-col min-h-screen">
      <HeroMotion />

      {/* Experience Preview */}
      <section className="w-full py-20 md:py-32 bg-slate-50/50 dark:bg-slate-950/20">
        <div className="container px-4 md:px-12 lg:px-24 mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row gap-12 md:gap-24">
            <div className="md:w-1/3 shrink-0 space-y-4">
              <div className="inline-flex items-center gap-2 text-primary font-semibold tracking-wider uppercase text-xs">
                <Briefcase className="h-4 w-4" /> Professional Journey
              </div>
              <h2 className="text-3xl font-bold tracking-tight md:text-5xl">Experience</h2>
              <p className="text-muted-foreground text-lg">
                Bridging the gap between theory and enterprise AI.
              </p>
            </div>
            <div className="md:w-2/3 space-y-12">
              {experience.map((exp, i) => (
                <div key={i} className="relative pl-8 border-l border-primary/20 pb-12 last:pb-0">
                  <div className="absolute left-[-5px] top-0 w-[9px] h-[9px] rounded-full bg-primary" />
                  <div className="flex flex-col gap-1 mb-4">
                    <h3 className="text-xl font-bold">{exp.role}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">{exp.company}</span>
                      <span>•</span>
                      <span>{exp.date}</span>
                      <span>•</span>
                      <span>{exp.location}</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4 font-medium">
                    {exp.description}
                  </p>
                  <ul className="space-y-3">
                    {exp.details.map((detail, j) => (
                      <li key={j} className="text-muted-foreground leading-relaxed flex gap-3 text-sm md:text-base">
                        <span className="text-primary/40 shrink-0">•</span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Education & Research */}
      <section className="w-full py-20 md:py-32 bg-background">
        <div className="container px-4 md:px-12 lg:px-24 mx-auto max-w-7xl">
          <div className="flex flex-col gap-8 md:gap-12">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-primary font-semibold tracking-wider uppercase text-xs">
                <GraduationCap className="h-4 w-4" /> Academic Excellence
              </div>
              <h2 className="text-3xl font-bold tracking-tight md:text-5xl">Education</h2>
            </div>
            <div className="space-y-12">
              {/* Redesigned without card */}
              <div className="space-y-4">
                <h3 className="text-4xl font-bold">{education.institution}</h3>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-primary/20 pb-4">
                  <p className="text-2xl text-muted-foreground">{education.degree}</p>
                  <p className="text-sm font-medium text-primary uppercase tracking-widest">{education.date}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="inline-block px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold uppercase tracking-[0.2em]">
                  Senior Thesis
                </div>
                <h4 className="text-2xl font-bold leading-tight">{education.thesis.title}</h4>
                <p className="text-muted-foreground leading-relaxed max-w-3xl">
                  {education.thesis.description}
                </p>
                <Button variant="link" className="p-0 h-auto text-primary font-bold group" asChild>
                  <a href={education.thesis.link} target="_blank" rel="noreferrer">
                    Read the Research Paper <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      <section className="w-full py-20 md:py-32 bg-slate-50/50 dark:bg-slate-950/20 border-t">
        <div className="container px-4 md:px-12 lg:px-24 mx-auto max-w-7xl space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight md:text-5xl">Featured Work</h2>
              <p className="text-muted-foreground text-lg max-w-[600px]">
                A collection of projects exploring the intersection of AI, Finance, and Data Science.
              </p>
            </div>
            <Button variant="outline" size="lg" className="rounded-full" asChild>
              <Link href="/projects">View All Projects</Link>
            </Button>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProjects.map((project, i) => (
              <Card key={i} className="group border-none shadow-none bg-transparent hover:bg-white/5 transition-all duration-500 rounded-3xl overflow-hidden flex flex-col border border-transparent hover:border-white/10">
                {/* Image removed as requested */}
                <CardContent className="p-6 flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-[10px] uppercase tracking-widest px-2 py-0.5">{project.type}</Badge>
                    {getProjectIcon(project.type)}
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300">{project.title}</CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-3">{project.description}</p>
                </CardContent>
                <CardFooter className="px-6 pb-6 pt-0">
                  <Button variant="ghost" size="sm" className="p-0 h-auto group-hover:translate-x-1 transition-transform" asChild>
                    <Link href={`/projects/${project.slug}`} className="flex items-center gap-2 font-semibold text-sm">
                      Details <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
