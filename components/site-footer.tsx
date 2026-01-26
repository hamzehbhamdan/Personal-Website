
import { personalInfo } from "@/lib/data";
import Link from "next/link";
import { Linkedin, Github, FileText } from "lucide-react";

export function SiteFooter() {
    return (
        <footer className="border-t py-6 md:py-8">
            <div className="container px-4 sm:px-8 mx-auto">
                <div className="grid gap-8 md:grid-cols-3">
                    {/* Navigation Links */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold">Navigation</h3>
                        <nav className="flex flex-col space-y-2 text-sm text-muted-foreground">
                            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
                            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
                            <Link href="/projects" className="hover:text-foreground transition-colors">Projects</Link>
                            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
                        </nav>
                    </div>

                    {/* Social Links */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold">Connect</h3>
                        <nav className="flex flex-col space-y-2 text-sm text-muted-foreground">
                            <a href={personalInfo.linkedin} target="_blank" rel="noreferrer" className="flex items-center hover:text-foreground transition-colors">
                                <Linkedin className="mr-2 h-4 w-4" />
                                LinkedIn
                            </a>
                            <a href={personalInfo.github} target="_blank" rel="noreferrer" className="flex items-center hover:text-foreground transition-colors">
                                <Github className="mr-2 h-4 w-4" />
                                GitHub
                            </a>
                            <a href={personalInfo.resume} target="_blank" rel="noreferrer" className="flex items-center hover:text-foreground transition-colors">
                                <FileText className="mr-2 h-4 w-4" />
                                Resume
                            </a>
                        </nav>
                    </div>

                    {/* Copyright */}
                    <div className="space-y-3 md:text-right">
                        <p className="text-sm text-muted-foreground">
                            &copy; {new Date().getFullYear()} {personalInfo.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Built with Next.js & shadcn/ui
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    )
}
