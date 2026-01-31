
"use client"

import { motion } from "framer-motion"
import { Mail, Phone, Linkedin, Github, FileText, MapPin, Send, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { personalInfo } from "@/lib/data";

export default function ContactPage() {
    return (
        <main className="min-h-[calc(100vh-4rem)] flex flex-col">
            <section className="flex-1 container mx-auto px-4 py-16 sm:px-8 space-y-12">
                <div className="flex flex-col md:flex-row justify-between gap-12">
                    <div className="flex-1 space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter">
                                Let's Connect
                            </h1>
                            <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
                                I'm always open to discussing new opportunities, collaborations, and innovative projects in AI and financial technology.
                            </p>
                        </motion.div>

                        <div className="grid gap-6 sm:grid-cols-2">
                            {[
                                { icon: Mail, label: "Email", value: personalInfo.email, link: `mailto:${personalInfo.email}` },
                                { icon: Linkedin, label: "LinkedIn", value: "Hamzeh Hamdan", link: personalInfo.linkedin },
                                { icon: Github, label: "GitHub", value: "hamzehbhamdan", link: personalInfo.github },
                                { icon: MapPin, label: "Location", value: personalInfo.location, link: null },
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="p-6 rounded-3xl bg-slate-50/50 dark:bg-slate-900/40 border border-primary/5 hover:border-primary/20 transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <item.icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{item.label}</div>
                                    <div className="font-semibold text-lg flex items-center gap-2">
                                        {item.link ? (
                                            <a href={item.link} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors flex items-center gap-2">
                                                {item.value} <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </a>
                                        ) : (
                                            item.value
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="w-full md:w-[400px] shrink-0"
                    >
                        <Card className="rounded-[40px] border-none shadow-2xl bg-white dark:bg-slate-950 overflow-hidden">
                            <div className="h-2 bg-primary w-full" />
                            <CardHeader className="p-8">
                                <CardTitle className="text-2xl">Quick Message</CardTitle>
                                <CardDescription>Reach me directly via email or LinkedIn for the fastest response.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 pt-0 space-y-6">
                                <Button className="w-full h-14 rounded-2xl text-lg font-bold group" size="lg" asChild>
                                    <a href={`mailto:${personalInfo.email}`} className="flex items-center justify-center gap-3">
                                        Send an Email <Send className="h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                                    </a>
                                </Button>

                                <div className="space-y-4 pt-6 border-t border-border/50">
                                    <div className="text-sm font-bold uppercase tracking-widest">Resources</div>
                                    <Button variant="outline" className="w-full h-12 rounded-xl justify-start font-semibold" asChild>
                                        <a href={personalInfo.resume} target="_blank" rel="noreferrer">
                                            <FileText className="mr-3 h-5 w-5 text-primary" /> View Resume
                                        </a>
                                    </Button>
                                </div>

                                <div className="pt-6 border-t border-border/50">
                                    <h4 className="text-sm font-bold uppercase tracking-widest mb-4">Availability</h4>
                                    <div className="flex items-start gap-3 p-4 rounded-2xl bg-green-500/5 border border-green-500/10">
                                        <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 animate-pulse shrink-0" />
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            Currently focusing on AI infrastructure at Cresset Capital, but open to consulting and collaborations.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </section>
        </main>
    )
}
