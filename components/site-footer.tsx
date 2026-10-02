
import { personalInfo } from "@/lib/data";
import Link from "next/link";
import { Linkedin, Github, Mail, FileText } from "lucide-react";

export function SiteFooter() {
    return (
        <footer className="border-t border-stone-200 bg-[#f9f8f6] py-10 md:py-14">
            <div className="mx-auto max-w-5xl px-6">
                <div className="flex flex-col md:flex-row justify-between gap-12">
                    {/* Brand */}
                    <div className="space-y-4">
                        <Link
                            href="/"
                            className="font-mono text-sm font-medium tracking-[0.14em] text-stone-900 hover:text-[#A51C30] transition-colors"
                        >
                            HH<span className="text-[#A51C30]">.</span>
                        </Link>
                        <p className="text-[15px] text-stone-500 leading-relaxed max-w-[200px]">
                            AI Software Engineer.<br />Harvard Class of 2025.<br />Chicago, IL.
                        </p>
                        <div className="flex items-center gap-4 pt-1">
                            <a
                                href={personalInfo.linkedin}
                                target="_blank"
                                rel="noreferrer"
                                className="text-stone-500 hover:text-stone-900 transition-colors"
                            >
                                <Linkedin className="h-4 w-4" />
                            </a>
                            <a
                                href={personalInfo.github}
                                target="_blank"
                                rel="noreferrer"
                                className="text-stone-500 hover:text-stone-900 transition-colors"
                            >
                                <Github className="h-4 w-4" />
                            </a>
                            <a
                                href={`mailto:${personalInfo.email}`}
                                className="text-stone-500 hover:text-stone-900 transition-colors"
                            >
                                <Mail className="h-4 w-4" />
                            </a>
                            <a
                                href={personalInfo.resume}
                                target="_blank"
                                rel="noreferrer"
                                className="text-stone-500 hover:text-stone-900 transition-colors"
                            >
                                <FileText className="h-4 w-4" />
                            </a>
                        </div>
                    </div>

                </div>

                <div className="mt-10 md:mt-12 pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-stone-500">
                        © {new Date().getFullYear()} {personalInfo.name}
                    </p>
                    <p className="font-mono text-[11px] tracking-[0.04em] text-stone-500">
                        psst: there&apos;s a terminal in the corner. press <kbd className="border border-stone-300 px-1">`</kbd> to open it.
                    </p>
                    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-stone-500">
                        Chicago, IL
                    </p>
                </div>
            </div>
        </footer>
    );
}
