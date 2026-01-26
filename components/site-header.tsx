
"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"

import { cn } from "@/lib/utils"
// import { Icons } from "@/components/icons"
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"

export function SiteHeader() {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = React.useState(false)

    const routes = [
        {
            href: "/",
            label: "Home",
            active: pathname === "/",
        },
        {
            href: "/about",
            label: "About",
            active: pathname === "/about",
        },
        {
            href: "/projects",
            label: "Projects",
            active: pathname === "/projects",
        },
        {
            href: "/contact",
            label: "Contact",
            active: pathname === "/contact",
        }
    ]

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center justify-between px-4 sm:px-8 mx-auto">
                <Link href="/" className="mr-6 flex items-center space-x-2">
                    <span className="font-bold text-xl tracking-tight">Hamzeh.</span>
                </Link>
                <div className="hidden md:flex md:items-center md:gap-2">
                    <NavigationMenu>
                        <NavigationMenuList>
                            {routes.map((route) => (
                                <NavigationMenuItem key={route.href}>
                                    <NavigationMenuLink asChild className={cn(navigationMenuTriggerStyle(), route.active && "bg-slate-100 dark:bg-slate-800")}>
                                        <Link href={route.href}>
                                            {route.label}
                                        </Link>
                                    </NavigationMenuLink>
                                </NavigationMenuItem>
                            ))}
                        </NavigationMenuList>
                    </NavigationMenu>
                    <ThemeToggle />
                </div>
                <div className="md:hidden flex items-center gap-2">
                    <ThemeToggle />
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                            <div className="flex flex-col h-full pl-6">
                                <SheetTitle className="sr-only">Menu</SheetTitle>
                                <div className="flex flex-col space-y-6 mt-8">
                                    {routes.map((route) => (
                                        <Link
                                            key={route.href}
                                            href={route.href}
                                            className={cn(
                                                "text-lg font-medium transition-colors hover:text-primary",
                                                route.active ? "text-primary font-semibold" : "text-muted-foreground"
                                            )}
                                            onClick={() => setIsOpen(false)}
                                        >
                                            {route.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    )
}
