
import { personalInfo } from "@/lib/data";
import Link from "next/link";
import { Linkedin, Github, FileText, Mail } from "lucide-react";

export function SiteFooter() {
    return (
        <footer className="border-t bg-slate-50/50 dark:bg-slate-950/20 py-12 md:py-20">
            <div className="container px-4 sm:px-8 mx-auto">
                <div className="grid gap-12 md:grid-cols-4">
                    {/* Brand & Bio */}
                    <div className="md:col-span-2 space-y-6">
                        <Link href="/" className="font-bold text-2xl tracking-tighter">Hamzeh<span className="text-primary">.</span></Link>
                        <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                            AI Software Engineer specializing in the intersection of quantitative finance and artificial intelligence. Harvard Class of 2025.
                        </p>
                        <div className="flex items-center gap-4">
                            <a href={personalInfo.linkedin} target="_blank" rel="noreferrer" className="p-2 rounded-full bg-background border border-border hover:border-primary/40 hover:text-primary transition-all">
                                <Linkedin className="h-4 w-4" />
                            </a>
                            <a href={personalInfo.github} target="_blank" rel="noreferrer" className="p-2 rounded-full bg-background border border-border hover:border-primary/40 hover:text-primary transition-all">
                                <Github className="h-4 w-4" />
                            </a>
                            <a href={`mailto:${personalInfo.email}`} className="p-2 rounded-full bg-background border border-border hover:border-primary/40 hover:text-primary transition-all">
                                <Mail className="h-4 w-4" />
                            </a>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Sitemap</h3>
                        <nav className="flex flex-col space-y-3 text-sm text-muted-foreground">
                            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                            <Link href="/about" className="hover:text-primary transition-colors">About</Link>
                            <Link href="/projects" className="hover:text-primary transition-colors">Projects</Link>
                            <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
                        </nav>
                    </div>

                    {/* Legal/Meta */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Resources</h3>
                        <nav className="flex flex-col space-y-3 text-sm text-muted-foreground">
                            <a href={personalInfo.resume} target="_blank" rel="noreferrer" className="flex items-center hover:text-primary transition-colors">
                                <FileText className="mr-2 h-4 w-4" />
                                Resume
                            </a>
                            <p className="text-xs pt-4 border-t border-border/50">
                                &copy; {new Date().getFullYear()} {personalInfo.name}
                            </p>
                            <p className="text-xs">
                                Chicago, IL / Remote
                            </p>
                        </nav>
                    </div>
                </div>
            </div>
        </footer>
    )
}
