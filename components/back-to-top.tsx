"use client"

import * as React from "react"
import { ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"

export function BackToTop() {
    const [visible, setVisible] = React.useState(false)

    React.useEffect(() => {
        const onScroll = () => setVisible(window.scrollY > 400)
        window.addEventListener("scroll", onScroll, { passive: true })
        return () => window.removeEventListener("scroll", onScroll)
    }, [])

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" })

    return (
        <button
            onClick={scrollToTop}
            aria-label="Back to top"
            className={cn(
                "fixed bottom-8 right-8 z-50 p-3 rounded-full",
                "bg-background border border-border shadow-lg",
                "text-muted-foreground hover:text-primary hover:border-primary/40",
                "transition-all duration-300",
                visible
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 translate-y-4 pointer-events-none"
            )}
        >
            <ArrowUp className="h-4 w-4" />
        </button>
    )
}
