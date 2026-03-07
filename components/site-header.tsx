
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"

export function SiteHeader() {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = React.useState(false)

    const routes = [
        { href: "/", label: "Home", active: pathname === "/" },
        { href: "/about", label: "About", active: pathname === "/about" },
        { href: "/projects", label: "Projects", active: pathname === "/projects" },
        { href: "/thesis", label: "Thesis", active: pathname === "/thesis" },
        { href: "/contact", label: "Contact", active: pathname === "/contact" },
        { href: "/consulting/blog", label: "Blog", active: pathname.startsWith("/consulting/blog") },
    ]

    const isConsultingActive = pathname === "/consulting"

    return (
        <header className="sticky top-0 z-50 w-full border-b border-stone-200 bg-[#f9f8f6]/95 backdrop-blur">
            <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-6">
                {/* Logo */}
                <Link
                    href="/"
                    className="font-mono text-sm font-medium tracking-[0.14em] text-stone-900 hover:text-[#A51C30] transition-colors"
                >
                    HH<span className="text-[#A51C30]">.</span>
                </Link>

                {/* Desktop nav */}
                <nav className="hidden md:flex items-center gap-7">
                    {routes.map((route) => (
                        <Link
                            key={route.href}
                            href={route.href}
                            className={cn(
                                "font-mono text-[10px] uppercase tracking-[0.2em] transition-colors pb-0.5",
                                route.active
                                    ? "text-stone-900 border-b border-[#A51C30]"
                                    : "text-stone-400 hover:text-stone-700"
                            )}
                        >
                            {route.label}
                        </Link>
                    ))}
                    <Link
                        href="/consulting"
                        className={cn(
                            "font-mono text-[10px] uppercase tracking-[0.2em] px-3 py-1 border transition-all",
                            isConsultingActive
                                ? "border-[#A51C30] text-[#A51C30] bg-[#A51C30]/8"
                                : "border-[#A51C30]/32 text-[#A51C30] hover:border-[#A51C30]/80 hover:bg-[#A51C30]/5"
                        )}
                    >
                        Consulting
                    </Link>
                </nav>

                {/* Mobile hamburger */}
                <div className="md:hidden">
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <button className="p-1 text-stone-500 hover:text-stone-900 transition-colors">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle Menu</span>
                            </button>
                        </SheetTrigger>
                        <SheetContent
                            side="right"
                            className="w-[240px] bg-[#f9f8f6] border-l border-stone-200 p-0"
                        >
                            <SheetTitle className="sr-only">Menu</SheetTitle>
                            <div className="flex flex-col pt-16 px-8 gap-7">
                                {routes.map((route) => (
                                    <Link
                                        key={route.href}
                                        href={route.href}
                                        onClick={() => setIsOpen(false)}
                                        className={cn(
                                            "font-mono text-[10px] uppercase tracking-[0.2em] transition-colors",
                                            route.active ? "text-stone-900" : "text-stone-400 hover:text-stone-700"
                                        )}
                                    >
                                        {route.label}
                                    </Link>
                                ))}
                                <Link
                                    href="/consulting"
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                        "font-mono text-[10px] uppercase tracking-[0.2em] text-[#A51C30] hover:text-[#7a0e1e] transition-colors",
                                        isConsultingActive && "font-semibold"
                                    )}
                                >
                                    Consulting ›
                                </Link>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    )
}
