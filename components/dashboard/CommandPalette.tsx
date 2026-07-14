"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Command, ArrowRight, Zap, Target, Users, BookOpen, Settings as SettingsIcon, File, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { Task, Contact } from "@/lib/types";

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    onAction: (action: string, payload?: any) => void;
}

interface SearchResult {
    id: string;
    label: string;
    icon: any;
    iconName?: string;
    category: string;
    type: "action" | "task" | "contact" | "note";
    payload?: any;
}

const ICON_MAP: Record<string, any> = {
    "Search": Search,
    "Command": Command,
    "ArrowRight": ArrowRight,
    "Zap": Zap,
    "Target": Target,
    "Users": Users,
    "BookOpen": BookOpen,
    "Settings": SettingsIcon,
    "File": File,
    "Clock": Clock
};

const STATIC_ACTIONS: SearchResult[] = [
    { id: "goto-momentum", label: "Switch to Momentum View", icon: Zap, iconName: "Zap", category: "Navigation", type: "action" },
    { id: "goto-directives", label: "Open Directives (Tasks)", icon: Target, iconName: "Target", category: "Navigation", type: "action" },
    { id: "goto-network", label: "Open Network (Contacts)", icon: Users, iconName: "Users", category: "Navigation", type: "action" },
    { id: "goto-brain", label: "Open Neural Brain", icon: BookOpen, iconName: "BookOpen", category: "Navigation", type: "action" },
    { id: "open-settings", label: "Open System Settings", icon: SettingsIcon, iconName: "Settings", category: "System", type: "action" },
    { id: "create-task", label: "Create New Directive", icon: Zap, iconName: "Zap", category: "Actions", type: "action" },
    { id: "open-calendar", label: "Open Calendar Protocol", icon: Clock, iconName: "Clock", category: "System", type: "action" },
    { id: "start-focus", label: "Initialize Focus Session", icon: Target, iconName: "Target", category: "Actions", type: "action" },
    { id: "toggle-theme", label: "Toggle System Theme", icon: Zap, iconName: "Zap", category: "System", type: "action" },
];

export function CommandPalette({ isOpen, onClose, onAction }: CommandPaletteProps) {
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [dynamicResults, setDynamicResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [recentlyViewed, setRecentlyViewed] = useState<SearchResult[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    // Filter static actions
    const filteredActions = STATIC_ACTIONS.filter(action =>
        action.label.toLowerCase().includes(query.toLowerCase()) ||
        action.category.toLowerCase().includes(query.toLowerCase())
    );

    // Combined results
    let results = [...filteredActions, ...dynamicResults];

    // Detect Google Search
    const isGoogleSearch = query.trim().toLowerCase().startsWith("g:") || query.trim().toLowerCase().startsWith("search:");
    if (isGoogleSearch) {
        const searchQuery = query.includes(':') ? query.substring(query.indexOf(':') + 1).trim() : "";
        if (searchQuery) {
            results = [{
                id: `google-search:${searchQuery}`,
                label: `Search Google: "${searchQuery}"`,
                icon: Search,
                iconName: "Search",
                category: "External",
                type: "action"
            }, ...results];
        }
    }

    // Load recently viewed on mount
    useEffect(() => {
        const saved = localStorage.getItem("recently-viewed");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const restored = parsed.map((item: any) => ({
                    ...item,
                    icon: item.iconName ? ICON_MAP[item.iconName] : File
                }));
                setRecentlyViewed(restored);
            } catch (e) {
                console.error("Failed to load recently viewed", e);
            }
        }
    }, []);

    // Live search dynamic data
    useEffect(() => {
        if (!query || query.length < 2) {
            setDynamicResults([]);
            return;
        }

        const fetchDynamicResults = async () => {
            setIsLoading(true);
            try {
                const [tasksRes, contactsRes, notesRes] = await Promise.all([
                    supabase.from('tasks').select('id, title').ilike('title', `%${query}%`).limit(3),
                    supabase.from('contacts').select('id, name').ilike('name', `%${query}%`).limit(3),
                    supabase.from('notes').select('id, title').ilike('title', `%${query}%`).limit(3)
                ]);

                const tasks: SearchResult[] = (tasksRes.data || []).map(t => ({
                    id: t.id,
                    label: t.title,
                    icon: Target,
                    iconName: "Target",
                    category: "Tasks",
                    type: "task"
                }));

                const contacts: SearchResult[] = (contactsRes.data || []).map(c => ({
                    id: c.id,
                    label: c.name,
                    icon: Users,
                    iconName: "Users",
                    category: "Contacts",
                    type: "contact"
                }));

                const notes: SearchResult[] = (notesRes.data || []).map(n => ({
                    id: n.id,
                    label: n.title,
                    icon: File,
                    iconName: "File",
                    category: "Notes",
                    type: "note"
                }));

                setDynamicResults([...tasks, ...contacts, ...notes]);
            } catch (e) {
                console.error("Dynamic search failed", e);
            } finally {
                setIsLoading(false);
            }
        };

        const timer = setTimeout(fetchDynamicResults, 300);
        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        if (isOpen) {
            setQuery("");
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const addToRecentlyViewed = (item: SearchResult) => {
        const updated = [item, ...recentlyViewed.filter(i => i.id !== item.id)].slice(0, 5);
        setRecentlyViewed(updated);

        // Don't serialize the icon function/component
        const storageItems = updated.map(i => {
            const { icon, ...rest } = i;
            return rest;
        });
        localStorage.setItem("recently-viewed", JSON.stringify(storageItems));
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === "Escape") onClose();
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % (results.length || 1));
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + results.length) % (results.length || 1));
            }
            if (e.key === "Enter") {
                const action = results[selectedIndex];
                if (action) {
                    addToRecentlyViewed(action);
                    onAction(action.id, action.type);
                    onClose();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, results, selectedIndex, onAction, onClose]);

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollContainerRef.current) {
            const activeItem = scrollContainerRef.current.querySelector(`[data-result-index="${selectedIndex}"]`);
            if (activeItem) {
                activeItem.scrollIntoView({ block: "nearest" });
            }
        }
    }, [selectedIndex]);

    const mono = { fontFamily: "var(--font-geist-mono), monospace" };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[rgba(40,35,22,0.45)]"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="relative w-full max-w-2xl bg-white border border-stone-200 rounded-[14px] shadow-2xl overflow-hidden"
                    >
                        <div className="p-6 border-b border-stone-200 flex items-center gap-4">
                            <Search className="text-stone-300" size={20} />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setSelectedIndex(0);
                                }}
                                placeholder="Execute command or search OS..."
                                className="bg-transparent flex-1 outline-none text-lg font-medium text-stone-900 placeholder:text-stone-300"
                            />
                            {isLoading && <Clock className="animate-spin text-[#A51C30]" size={16} />}
                            <div className="flex items-center gap-1 px-2 py-1 bg-stone-50 rounded-lg border border-stone-200">
                                <Command size={12} className="text-stone-400" />
                                <span className="font-mono text-[10px] font-medium text-stone-400" style={mono}>K</span>
                            </div>
                        </div>

                        <div ref={scrollContainerRef} className="max-h-[450px] overflow-y-auto custom-scrollbar p-2">
                            {!query && recentlyViewed.length > 0 && (
                                <div className="mb-4">
                                    <div className="px-4 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-stone-400" style={mono}>Recently Viewed</div>
                                    {recentlyViewed.map((item, idx) => (
                                        <button
                                            key={`recent-${item.id}`}
                                            onClick={() => {
                                                onAction(item.id, item.type);
                                                onClose();
                                            }}
                                            className="w-full flex items-center gap-4 px-4 py-2 rounded-lg text-stone-500 hover:bg-stone-50 hover:text-stone-900 transition-all text-left"
                                        >
                                            <item.icon size={14} className="text-stone-400" />
                                            <span className="font-mono text-[11px] uppercase tracking-[0.06em]" style={mono}>{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {results.length > 0 ? (
                                <div className="space-y-1">
                                    {results.map((item, idx) => {
                                        const Icon = item.icon;
                                        const isSelected = idx === selectedIndex;
                                        return (
                                            <button
                                                key={item.id}
                                                data-result-index={idx}
                                                onClick={() => {
                                                    addToRecentlyViewed(item);
                                                    onAction(item.id, item.type);
                                                    onClose();
                                                }}
                                                onMouseEnter={() => setSelectedIndex(idx)}
                                                className={cn(
                                                    "w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all group",
                                                    isSelected ? "bg-[#A51C30] text-white" : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                                                )}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "p-2 rounded-lg transition-colors",
                                                        isSelected ? "bg-white/15" : "bg-stone-100"
                                                    )}>
                                                        <Icon size={18} />
                                                    </div>
                                                    <div className="text-left">
                                                        <span className="font-mono text-[12px] uppercase tracking-[0.06em] block" style={mono}>{item.label}</span>
                                                        <span className={cn(
                                                            "font-mono text-[9px] uppercase tracking-[0.18em]",
                                                            isSelected ? "text-white/60" : "text-stone-400"
                                                        )} style={mono}>
                                                            {item.category}
                                                        </span>
                                                    </div>
                                                </div>
                                                {isSelected && (
                                                    <motion.div layoutId="arrow">
                                                        <ArrowRight size={16} />
                                                    </motion.div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : query && !isLoading && (
                                <div className="py-12 text-center">
                                    <p className="font-mono text-stone-400 tracking-[0.18em] uppercase text-[11px]" style={mono}>No Results Found</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="px-1.5 py-0.5 bg-white rounded border border-stone-200 font-mono text-[9px] font-medium text-stone-500" style={mono}>↑↓</div>
                                    <span className="font-mono text-[9px] text-stone-400 uppercase tracking-[0.14em]" style={mono}>Navigate</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="px-1.5 py-0.5 bg-white rounded border border-stone-200 font-mono text-[9px] font-medium text-stone-500" style={mono}>ENTER</div>
                                    <span className="font-mono text-[9px] text-stone-400 uppercase tracking-[0.14em]" style={mono}>Execute</span>
                                </div>
                            </div>
                            <div className="font-mono text-[9px] text-stone-300 uppercase tracking-[0.2em]" style={mono}>Neural OS v2.5</div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
