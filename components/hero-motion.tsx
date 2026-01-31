
"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, FileText, Linkedin, Github } from "lucide-react"
import { Button } from "@/components/ui/button"
import { personalInfo } from "@/lib/data"

export function HeroMotion() {
    return (
        <section className="relative overflow-hidden w-full py-20 md:py-32 lg:py-48 bg-background mesh-gradient">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.4, scale: 1 }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                    className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 0.4, scale: 1.2 }}
                    transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", delay: 1 }}
                    className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[150px]"
                />
            </div>

            <div className="container px-4 md:px-6 mx-auto relative">
                <div className="grid gap-12 lg:grid-cols-[1fr_650px] items-center">
                    <div className="flex flex-col justify-center space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="space-y-4"
                        >
                            <div className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary border border-primary/20 backdrop-blur-sm">
                                Software Engineer & Data Scientist
                            </div>
                            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl xl:text-7xl/none">
                                Hi, I'm Hamzeh.
                                <br />
                                Building AI That Works.
                            </h1>
                            <div className="space-y-4 max-w-[600px]">
                                <p className="text-muted-foreground text-lg md:text-xl leading-relaxed">
                                    {personalInfo.bio}
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="flex flex-col gap-4 sm:flex-row items-center"
                        >
                            <Button size="lg" className="rounded-full px-8 h-12 text-base font-semibold group" asChild>
                                <Link href="/projects">
                                    View Projects
                                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </Button>
                            <Button variant="outline" size="lg" className="rounded-full px-8 h-12 text-base font-semibold backdrop-blur-sm" asChild>
                                <Link href="/about">
                                    The Story
                                </Link>
                            </Button>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="flex items-center gap-6 text-sm"
                        >
                            <a href={personalInfo.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-medium">
                                <Linkedin className="h-4 w-4" /> LinkedIn
                            </a>
                            <a href={personalInfo.github} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-medium">
                                <Github className="h-4 w-4" /> GitHub
                            </a>
                            <a href={personalInfo.resume} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-medium border-l border-border pl-6">
                                <FileText className="h-4 w-4" /> Download Resume
                            </a>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="relative mx-auto w-full max-w-[650px] lg:max-w-none group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-blue-500/20 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-60"></div>
                        <div className="relative aspect-video overflow-hidden rounded-3xl bg-muted shadow-2xl border border-white/10 glass transition-transform duration-500 group-hover:scale-[1.02]">
                            <Image
                                src="/portrait.png"
                                alt="Hamzeh Hamdan"
                                fill
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                priority
                            />
                            {/* Overlay for depth */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60"></div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section >
    )
}
