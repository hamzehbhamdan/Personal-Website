"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, CheckSquare, Users, Brain, Settings as SettingsIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { MomentumView } from "./MomentumView";
import { TaskBoard } from "./TaskBoard";
import { CrmView } from "./CrmView";
import { SecondBrainView } from "./SecondBrainView";
import { SettingsModal } from "./SettingsModal";
import { CommandPalette } from "./CommandPalette";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";
import { DashboardSettings, Task } from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { SupabaseClient } from "@supabase/supabase-js";
import { Toaster } from "sonner";

type ViewMode = "home" | "tasks" | "crm" | "brain";

// type Task = { id: string; title: string; completed: boolean; }; // Example Task type

export function DashboardShell() {
    const supabase = createSupabaseBrowserClient();
    const [activeView, setActiveView] = useState<ViewMode>("home");
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
    const [tasks, setTasks] = useState<Task[]>([]); // Lifted state for shared access
    const [isMounted, setIsMounted] = useState(false);

    const [settings, setSettings] = useState<DashboardSettings>({
        userName: "Hamzeh Hamdan",
        background: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=2070&auto=format&fit=crop",
        font: "var(--font-geist-sans)",
        widgets: ["clock", "focus", "tasks"],
        glassOpacity: 20,
        glassBlur: 16,
        theme: "glass",
        primaryColor: "#ffffff",
        themeMode: "dark",
        recentBackgrounds: [],
        showQuotes: false,
        quotes: [
            { id: "1", text: "The best way to predict the future is to create it.", author: "Peter Drucker", isFavorite: true, order: 0, displayDuration: 10 },
            { id: "2", text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs", isFavorite: false, order: 1, displayDuration: 10 }
        ],
        onlyShowFavoriteQuotes: false,
        gcalConnected: false,
        showNicknames: false,
        neuralSettings: {
            temperature: 0.7,
            model: "gpt-4-turbo",
            maxTokens: 1000,
            retrievalCount: 5
        },
        autonomousSync: false,
        openSearchInNewTab: false
    });

    // Global listener for command palette
    useEffect(() => {
        const handleOpenCommandPalette = () => setIsCommandPaletteOpen(true);
        window.addEventListener('open-command-palette', handleOpenCommandPalette);
        return () => window.removeEventListener('open-command-palette', handleOpenCommandPalette);
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Skip if user is typing in an input
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return;
            }

            // Command palette: Cmd/Ctrl + K
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setIsCommandPaletteOpen(prev => !prev);
                return;
            }

            // Skip if any modal is open
            if (isCommandPaletteOpen || isSettingsOpen || isShortcutsOpen) return;

            switch (e.key) {
                case "1": setActiveView("home"); break;
                case "2": setActiveView("tasks"); break;
                case "3": setActiveView("crm"); break;
                case "4": setActiveView("brain"); break;
                case "n":
                case "N":
                    setActiveView("tasks");
                    // Task creation will be triggered by TaskBoard listening for a global event
                    setTimeout(() => window.dispatchEvent(new CustomEvent('create-new-task')), 100);
                    break;
                case ",": setIsSettingsOpen(true); break;
                case "?":
                    e.preventDefault();
                    setIsShortcutsOpen(true);
                    break;
            }

            // Global Navigation Shortcuts
            if (e.metaKey || e.ctrlKey) {
                const views: ViewMode[] = ["home", "tasks", "crm", "brain"];
                const currentIndex = views.indexOf(activeView);

                if (e.shiftKey) {
                    // Cmd + Shift + Arrows: View Switching within Page (Dispatch event)
                    if (e.key === "ArrowRight") {
                        e.preventDefault();
                        window.dispatchEvent(new CustomEvent('switch-subview', { detail: { direction: 'next' } }));
                    } else if (e.key === "ArrowLeft") {
                        e.preventDefault();
                        window.dispatchEvent(new CustomEvent('switch-subview', { detail: { direction: 'prev' } }));
                    }
                } else {
                    // Cmd + Arrows: Main Page Navigation
                    if (e.key === "ArrowRight") {
                        e.preventDefault();
                        const nextIndex = (currentIndex + 1) % views.length;
                        setActiveView(views[nextIndex]);
                    } else if (e.key === "ArrowLeft") {
                        e.preventDefault();
                        const prevIndex = (currentIndex - 1 + views.length) % views.length;
                        setActiveView(views[prevIndex]);
                    }
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isCommandPaletteOpen, isSettingsOpen, isShortcutsOpen, activeView]);

    const handleCommandAction = (actionId: string, type?: string) => {
        if (type === "task") {
            setActiveView("tasks");
            return;
        }

        if (type === "contact") {
            setActiveView("crm");
            return;
        }

        if (type === "note") {
            setActiveView("home");
            setTimeout(() => window.dispatchEvent(new Event('open-quick-notes')), 100);
            return;
        }

        switch (actionId) {
            case "goto-momentum": setActiveView("home"); break;
            case "goto-directives": setActiveView("tasks"); break;
            case "goto-network": setActiveView("crm"); break;
            case "goto-brain": setActiveView("brain"); break;
            case "open-settings": setIsSettingsOpen(true); break;
            case "open-calendar":
                setActiveView("home");
                setTimeout(() => window.dispatchEvent(new Event('open-calendar-popup')), 100);
                break;
            case "start-focus":
                setActiveView("home");
                setTimeout(() => window.dispatchEvent(new Event('start-focus-session')), 100);
                break;
            case "toggle-theme":
                setSettings(prev => ({
                    ...prev,
                    themeMode: prev.themeMode === 'dark' ? 'light' : 'dark'
                }));
                break;
            case "create-task":
                setActiveView("tasks");
                setTimeout(() => window.dispatchEvent(new CustomEvent('create-new-task')), 100);
                break;
            default: console.log("Unknown action:", actionId);
        }
    };

    useEffect(() => {
        setIsMounted(true);
        const saved = localStorage.getItem("dashboard-settings");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setSettings((prev) => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error("Failed to parse settings", e);
            }
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user?.app_metadata?.provider === 'google' || session?.provider_token) {
                setSettings(prev => ({ ...prev, gcalConnected: true }));
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (isMounted) {
            localStorage.setItem("dashboard-settings", JSON.stringify(settings));

            const root = document.documentElement;
            root.style.setProperty("--dashboard-font", settings.font);
            root.style.setProperty("--glass-opacity", `${settings.glassOpacity / 100}`);
            root.style.setProperty("--glass-blur", `${settings.glassBlur}px`);
            root.style.setProperty("--primary-accent", settings.primaryColor);

            // Force update for theme-aware components
            if (settings.themeMode === "light") {
                root.classList.add("light");
                root.classList.remove("dark");
            } else {
                root.classList.add("dark");
                root.classList.remove("light");
            }
        }
    }, [settings, isMounted]);

    const navItems = [
        { id: "home", label: "Home", icon: LayoutGrid },
        { id: "tasks", label: "Tasks", icon: CheckSquare },
        { id: "crm", label: "People", icon: Users },
        { id: "brain", label: "Brain", icon: Brain },
    ] as const;

    return (
        <div
            className={cn(
                "relative h-screen w-screen overflow-hidden bg-black selection:bg-white/30 transition-colors duration-500",
                settings.themeMode === "dark" ? "text-white" : "text-zinc-900 bg-zinc-50"
            )}
            style={{ fontFamily: "var(--dashboard-font, var(--font-geist-sans))" }}
            data-theme={settings.theme}
        >
            {/* Background Layer */}
            {isMounted && (
                <motion.div
                    key={settings.background}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0 z-0 after:content-[''] after:absolute after:inset-0 after:bg-black/40 after:backdrop-grayscale-[0.2]"
                    style={{
                        backgroundImage: `url(${settings.background})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                />
            )}

            {/* Content Layer */}
            <main className="relative z-10 h-full w-full flex flex-col">
                {/* Top Bar */}
                <div className="absolute top-0 right-0 p-6 flex gap-4 z-[60]">
                    <button
                        onClick={() => {
                            console.log("Opening settings...");
                            setIsSettingsOpen(true);
                        }}
                        className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full transition-all text-white/40 hover:text-white backdrop-blur-md cursor-pointer pointer-events-auto"
                    >
                        <SettingsIcon size={20} />
                    </button>
                </div>

                {/* Central Stage */}
                <div className="flex-1 flex flex-col relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeView}
                            initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                            exit={{ opacity: 0, scale: 1.02, filter: "blur(10px)" }}
                            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                            className="h-full w-full"
                        >
                            {activeView === "home" && <MomentumView settings={settings} setSettings={setSettings} tasks={tasks} setTasks={setTasks} />}
                            {activeView === "tasks" && <TaskBoard />}
                            {activeView === "crm" && <CrmView settings={settings} />}
                            {activeView === "brain" && <SecondBrainView settings={settings} onSettingsChange={setSettings} />}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Dock Navigation - Responsive */}
                <div className="absolute bottom-12 left-0 right-0 md:left-1/2 md:right-auto md:-translate-x-1/2 flex justify-center p-4 md:p-0">
                    <div className="flex items-center gap-2 p-2 rounded-2xl bg-black/40 md:bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl w-full md:w-auto justify-around md:justify-start">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeView === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveView(item.id as ViewMode)}
                                    className={cn(
                                        "relative w-14 h-14 md:w-12 md:h-12 rounded-xl flex flex-col md:flex-row items-center justify-center transition-all duration-300 group gap-1",
                                        isActive
                                            ? "bg-white/20 text-white shadow-lg"
                                            : "hover:bg-white/10 text-white/60 hover:text-white"
                                    )}
                                >
                                    <Icon size={20} strokeWidth={2} />
                                    {/* Mobile label */}
                                    <span className="text-[9px] font-bold md:hidden">{item.label}</span>

                                    {/* Desktop Tooltip */}
                                    <span className="hidden md:block absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        {item.label}
                                    </span>

                                    {/* Active Indicator */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="active-dot"
                                            className="hidden md:block absolute -bottom-1 w-1 h-1 bg-white rounded-full"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </main>

            {isMounted && (
                <SettingsModal
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    currentSettings={settings}
                    onSave={(newSettings) => setSettings(newSettings)}
                />
            )}
            {isMounted && (
                <Toaster position="bottom-right" theme={settings.themeMode === 'dark' ? 'dark' : 'light'} />
            )}
            {isMounted && (
                <CommandPalette
                    isOpen={isCommandPaletteOpen}
                    onClose={() => setIsCommandPaletteOpen(false)}
                    onAction={handleCommandAction}
                />
            )}
            {isMounted && (
                <KeyboardShortcutsModal
                    isOpen={isShortcutsOpen}
                    onClose={() => setIsShortcutsOpen(false)}
                />
            )}
        </div>
    );
}
