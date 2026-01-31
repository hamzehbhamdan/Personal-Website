
"use client"

import { motion } from "framer-motion"
import Image from "next/image";
import Link from "next/link";
import {
    GraduationCap,
    Briefcase,
    Award,
    BookOpen,
    Users,
    Trophy,
    MapPin,
    Mail,
    Phone,
    Linkedin,
    Github,
    FileText,
    Sparkles,
    Target,
    Heart,
    ArrowRight
} from "lucide-react";

import { personalInfo, education, experience, harvardActivities } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function AboutPage() {
    return (
        <main className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="relative py-24 md:py-32 overflow-hidden mesh-gradient">
                <div className="container px-4 md:px-6 mx-auto relative z-10">
                    <div className="grid gap-16 lg:grid-cols-2 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-8"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold border border-primary/20 backdrop-blur-sm">
                                <Sparkles className="h-4 w-4" />
                                My Story
                            </div>
                            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-none">
                                Bridging AI & Reality
                            </h1>
                            <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
                                {personalInfo.fullBio}
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Button size="lg" className="rounded-full px-8 h-12" asChild>
                                    <Link href="/contact">Get in Touch</Link>
                                </Button>
                                <Button variant="outline" size="lg" className="rounded-full px-8 h-12" asChild>
                                    <a href={personalInfo.resume} target="_blank" rel="noreferrer">
                                        <FileText className="mr-2 h-4 w-4" /> Resume
                                    </a>
                                </Button>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative"
                        >
                            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-30 animate-pulse"></div>
                            <div className="relative aspect-[4/5] md:aspect-[16/10] rounded-3xl overflow-hidden glass shadow-2xl">
                                <Image
                                    src="/portrait.png"
                                    alt="Hamzeh Hamdan"
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Journey Timeline */}
            <section className="py-24 md:py-32 bg-background">
                <div className="container px-4 md:px-6 mx-auto">
                    <div className="max-w-4xl mx-auto space-y-16">
                        <div className="text-center space-y-4">
                            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">My Journey</h2>
                            <p className="text-xl text-muted-foreground uppercase tracking-widest text-sm font-bold">The path to excellence</p>
                        </div>

                        <div className="space-y-8">
                            {[
                                {
                                    title: "The Spark",
                                    content: "My passion for AI ignited during my first semester at Harvard, when I gained early access to ChatGPT. This shifted my focus from pure mathematics to the intersection of statistics and computer science.",
                                    icon: Target
                                },
                                {
                                    title: "Impact Focused",
                                    content: "I've built generative AI tools increasing efficiency by 93% at Comcast and developed quantum-based portfolio optimization algorithms at MIT. I bridge the gap between cutting-edge research and corporate implementation.",
                                    icon: Sparkles
                                },
                                {
                                    title: "Giving Back",
                                    content: "I'm dedicated to teaching, mentoring students in AI and coding. I've led workshops globally, from Harvard Summer Camps to international seminars in Turkey and the UAE.",
                                    icon: Heart
                                }
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="group relative pl-8 border-l border-primary/20 pb-12 last:pb-0"
                                >
                                    <div className="absolute left-[-16px] top-0 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center group-hover:bg-primary transition-colors">
                                        <item.icon className="h-4 w-4 text-primary group-hover:text-white transition-colors" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-bold">{item.title}</h3>
                                        <p className="text-lg text-muted-foreground leading-relaxed">
                                            {item.content}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Academic Foundation */}
            <section className="py-24 md:py-32 bg-slate-50/50 dark:bg-slate-950/20 border-y">
                <div className="container px-4 md:px-6 mx-auto">
                    <div className="grid lg:grid-cols-[1fr_2fr] gap-16 items-start">
                        <div className="space-y-6">
                            <div className="w-16 h-1 bg-primary"></div>
                            <h2 className="text-4xl font-bold tracking-tight leading-tight">Harvard <br />University</h2>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Harvard Class of 2025. Studying the mathematical foundations of intelligence and the statistical methods of discovery.
                            </p>
                            <Badge variant="outline" className="text-primary border-primary/20 px-4 py-1 rounded-full font-bold">A.B. in Computer Science & Statistics</Badge>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-8">
                            <Card className="rounded-3xl border-none shadow-xl bg-background hover:scale-[1.02] transition-transform">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BookOpen className="h-5 w-5 text-primary" /> Computer Science
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2 text-muted-foreground font-medium">
                                        {education.courses.cs.map((c, i) => <li key={i}>• {c.split('(')[0].trim()}</li>)}
                                    </ul>
                                </CardContent>
                            </Card>
                            <Card className="rounded-3xl border-none shadow-xl bg-background hover:scale-[1.02] transition-transform">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-green-500" /> Stats & Math
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2 text-muted-foreground font-medium">
                                        {[...education.courses.stats, ...education.courses.math].slice(0, 6).map((c, i) => <li key={i}>• {c.split('(')[0].trim()}</li>)}
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mt-16 glass rounded-[40px] p-8 md:p-12 relative overflow-hidden"
                    >
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-16">
                            <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center shrink-0">
                                <Award className="h-12 w-12 text-primary" />
                            </div>
                            <div className="space-y-4 flex-1">
                                <Badge className="bg-primary/10 text-primary border-none uppercase tracking-widest text-[10px]">Senior Thesis</Badge>
                                <h3 className="text-3xl font-bold leading-tight">{education.thesis.title}</h3>
                                <p className="text-muted-foreground leading-relaxed max-w-3xl">
                                    {education.thesis.description}
                                </p>
                                <Button size="lg" className="rounded-full group" asChild>
                                    <a href={education.thesis.link} target="_blank" rel="noreferrer">
                                        Read the Full Thesis <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Activities */}
            <section className="py-24 md:py-32">
                <div className="container px-4 md:px-6 mx-auto">
                    <div className="text-center space-y-4 mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Beyond the Code</h2>
                        <p className="text-muted-foreground">Leadership and impact in the Harvard community</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {harvardActivities.slice(0, 6).map((activity, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <Card className="h-full border-none shadow-sm bg-slate-50/50 dark:bg-slate-900/40 hover:bg-background hover:shadow-xl transition-all duration-500 rounded-[32px] overflow-hidden group">
                                    <CardHeader className="p-8">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <CardTitle className="text-xl group-hover:text-primary transition-colors">{activity.title}</CardTitle>
                                                <p className="text-xs font-bold uppercase tracking-widest text-primary/60">{activity.role}</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="px-8 pb-8">
                                        <ul className="space-y-3">
                                            {activity.details.map((detail, j) => (
                                                <li key={j} className="text-sm text-muted-foreground leading-relaxed flex gap-2">
                                                    <span className="text-primary/40">•</span>
                                                    {detail}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}

import { TrendingUp } from "lucide-react";
