
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, FileText, Linkedin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { personalInfo, projects, experience, harvardActivities, education } from "@/lib/data";
import {
  Card,
  CardContent,
  CardDescription,
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

  return (
    <main className="flex flex-col min-h-[calc(100vh-14rem)]">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center py-12 md:py-24 lg:py-32 bg-gray-50/50 dark:bg-black">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-4 xl:grid-cols-[1fr_600px] items-center">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800 text-muted-foreground">
                  Software Engineer & Data Scientist
                </div>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Hi, I'm Hamzeh. <br />
                  Building AI That Works.
                </h1>
                <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                  {personalInfo.bio}
                </p>
                <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                  {personalInfo.bioEducation}
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button size="lg" asChild>
                  <Link href="/projects">
                    View Projects <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/about">
                    Learn More
                  </Link>
                </Button>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <a href={personalInfo.linkedin} target="_blank" rel="noreferrer" className="flex items-center hover:underline">
                  <Linkedin className="mr-1 h-3 w-3" /> LinkedIn
                </a>
                <a href={personalInfo.resume} target="_blank" rel="noreferrer" className="flex items-center hover:underline">
                  <FileText className="mr-1 h-3 w-3" /> Resume
                </a>
              </div>
            </div>
            <div className="mx-auto flex w-full max-w-[400px] lg:max-w-none items-center justify-center">
              <div className="relative w-full max-w-2xl">
                {/* Decorative background - optimized for widescreen */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl transform rotate-2"></div>
                <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted shadow-xl">
                  <Image
                    src="/portrait.png"
                    alt="Hamzeh Hamdan"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Experience Preview */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50/50 dark:bg-black">
        <div className="container px-4 md:px-6 mx-auto space-y-16">

          {/* Professional Experience */}
          <div className="space-y-8">
            <div className="space-y-2 text-left">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Experience</h2>
              <p className="max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                My professional journey in AI and Finance.
              </p>
            </div>
            <div className="max-w-4xl space-y-8">
              {experience.map((exp, i) => (
                <div key={i} className="flex flex-col md:flex-row gap-4 md:gap-8 items-start text-left">
                  <div className="md:w-1/4 shrink-0">
                    <h3 className="font-bold">{exp.company}</h3>
                    <p className="text-sm text-muted-foreground">{exp.date}</p>
                    <p className="text-sm text-muted-foreground">{exp.location}</p>
                  </div>
                  <div className="md:w-3/4 space-y-2">
                    <h4 className="font-semibold text-lg">{exp.role}</h4>
                    <p className="text-sm text-muted-foreground">{exp.description}</p>
                    <ul className="list-disc list-outside ml-4 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                      {exp.details.map((detail, j) => (
                        <li key={j}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>


          {/* Education & Research (List Layout) */}
          <div className="space-y-12">
            <div className="space-y-2 text-left">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Education & Harvard Research</h2>
              <p className="max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                My academic background and senior thesis.
              </p>
            </div>

            <div className="max-w-4xl space-y-12">
              {/* 1. Degree Block */}
              <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-start text-left">
                <div className="md:w-1/4 shrink-0">
                  <h3 className="font-bold text-lg">Degree</h3>
                  <p className="text-sm text-muted-foreground">{education.date}</p>
                </div>
                <div className="md:w-3/4 space-y-6">
                  <div>
                    <h4 className="font-semibold text-xl">{education.institution}</h4>
                    <p className="text-base text-muted-foreground">{education.degree}</p>
                  </div>

                  <div>
                    <h5 className="font-medium text-xs uppercase tracking-wider text-muted-foreground mb-3">Relevant Courses</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                      <div className="space-y-1.5">
                        <div className="font-medium text-foreground">Computer Science</div>
                        <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                          {education.courses.cs.map((c, i) => <li key={i} className="leading-tight">{c.split('(')[0].trim()}</li>)}
                        </ul>
                      </div>
                      <div className="space-y-1.5">
                        <div className="font-medium text-foreground">Statistics</div>
                        <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                          {education.courses.stats.map((c, i) => <li key={i} className="leading-tight">{c.split('(')[0].trim()}</li>)}
                        </ul>
                      </div>
                      <div className="space-y-1.5">
                        <div className="font-medium text-foreground">Mathematics</div>
                        <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                          {education.courses.math.map((c, i) => <li key={i} className="leading-tight">{c.split('(')[0].trim()}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-800" />

              {/* 2. Thesis Block */}
              <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-start text-left">
                <div className="md:w-1/4 shrink-0">
                  <h3 className="font-bold text-lg">Senior Thesis</h3>
                </div>
                <div className="md:w-3/4 space-y-4">
                  <div>
                    <h4 className="font-semibold text-xl leading-snug">{education.thesis.title}</h4>
                    <p className="text-base text-muted-foreground mt-2 leading-relaxed">{education.thesis.description}</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={education.thesis.link} target="_blank" rel="noreferrer">Read Full Thesis</a>
                  </Button>
                </div>
              </div>
            </div>
          </div>


        </div>
      </section>

      {/* Featured Projects Preview */}
      <section className="w-full py-12 md:py-24 lg:py-32 bg-background border-t">
        <div className="container px-4 md:px-6 mx-auto space-y-8">
          <div className="flex flex-col items-start justify-center space-y-4 text-left">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">Featured Projects</h2>
              <p className="max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                A glimpse into my recent work.
              </p>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProjects.map((project, i) => (
              <Card key={i} className="hover:shadow-md transition-shadow h-full flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs truncate max-w-[70%]">{project.type}</Badge>
                  </div>
                  <CardTitle className="leading-tight text-lg">{project.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {project.description}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/projects/${project.slug}`}>View Details <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          <div className="flex justify-center">
            <Button variant="outline" size="lg" asChild>
              <Link href="/projects">View All Projects</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
