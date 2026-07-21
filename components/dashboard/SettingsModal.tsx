"use client";

import { useState, useEffect, useRef } from "react";
import {
    Settings, X, Image as ImageIcon, Type, Layout, Save, Sliders, Palette,
    Upload, Sun, Moon, History, Monitor, Shield, Database, Cloud, AlertCircle,
    ChevronRight, RefreshCcw, Trash2, Download, Quote as QuoteIcon, Heart, Calendar as CalendarIcon, User,
    type LucideIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardSettings } from "@/lib/types";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentSettings: DashboardSettings;
    onSave: (settings: DashboardSettings) => void;
}

type TabID = "workspace" | "appearance" | "modules" | "account" | "integrations";

export function SettingsModal({ isOpen, onClose, currentSettings, onSave }: SettingsModalProps) {
    const supabase = createSupabaseBrowserClient(); // Initialize locally
    const [settings, setSettings] = useState<DashboardSettings>(currentSettings);
    const [activeTab, setActiveTab] = useState<TabID>("workspace");
    const [isSyncing, setIsSyncing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Re-seed the editable form from the caller's saved settings whenever the modal
    // opens (and when the caller's settings change while it is open). This is an
    // intentional external-prop -> local-form sync; a render-phase reset can't
    // reproduce both triggers without extra bookkeeping, so the rule is scoped off.
    useEffect(() => {
        if (isOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate prop->form sync on open
            setSettings(currentSettings);
        }
    }, [isOpen, currentSettings]);

    const tabs: { id: TabID; label: string; icon: LucideIcon }[] = [
        { id: "workspace", label: "Workspace", icon: Monitor },
        { id: "appearance", label: "Appearance", icon: Palette },
        { id: "modules", label: "Modules", icon: Layout },
        { id: "integrations", label: "Integrations", icon: Cloud },
        { id: "account", label: "Security & Data", icon: Shield },
    ];

    const fonts = [
        { name: "Geist Sans", value: "var(--font-geist-sans)" },
        { name: "Geist Mono", value: "var(--font-geist-mono)" },
        { name: "Sans Serif", value: "sans-serif" },
        { name: "Serif", value: "serif" },
    ];

    const handleSave = () => {
        setIsSyncing(true);
        const recent = settings.recentBackgrounds || [];
        let updatedRecent = [...recent];
        if (settings.background && !recent.includes(settings.background)) {
            updatedRecent = [settings.background, ...recent].slice(0, 8);
        }

        // Simulate sync
        setTimeout(() => {
            onSave({ ...settings, recentBackgrounds: updatedRecent });
            setIsSyncing(false);
            onClose();
        }, 800);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const url = event.target?.result as string;
                setSettings({ ...settings, background: url });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className={cn(
                            "relative w-full max-w-4xl max-h-[90vh] md:h-[650px] border rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row transition-colors duration-500",
                            settings.themeMode === 'light' ? 'bg-white border-zinc-200 text-zinc-900' : 'bg-zinc-950 border-white/10 text-white'
                        )}
                    >
                        {/* Sidebar - horizontal on mobile, vertical on desktop */}
                        <aside className={cn(
                            "md:w-[240px] shrink-0 border-b md:border-b-0 md:border-r flex flex-row md:flex-col p-4 md:p-6 gap-4 md:gap-6 transition-colors duration-500 overflow-x-auto md:overflow-x-visible",
                            settings.themeMode === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-white/[0.02] border-white/10'
                        )}>
                            <div className="hidden md:flex items-center gap-3 mb-4">
                                <div className="p-2 bg-primary rounded-xl text-black">
                                    <Settings size={20} />
                                </div>
                                <h2 className="font-bold text-lg tracking-tight">System</h2>
                            </div>

                            <nav className="flex flex-row md:flex-col gap-1 md:flex-1">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={cn(
                                                "flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-xl md:rounded-2xl text-xs md:text-sm font-semibold transition-all group whitespace-nowrap",
                                                isActive
                                                    ? (settings.themeMode === 'light' ? 'bg-zinc-900 text-white' : 'bg-white text-black')
                                                    : (settings.themeMode === 'light' ? 'text-zinc-500 hover:bg-zinc-200/50 hover:text-zinc-900' : 'text-white/40 hover:bg-white/5 hover:text-white')
                                            )}
                                        >
                                            <Icon size={16} className={cn(isActive ? "opacity-100" : "opacity-40 group-hover:opacity-100")} />
                                            <span className="hidden md:inline">{tab.label}</span>
                                            {isActive && (
                                                <motion.div layoutId="tab-indicator" className="hidden md:block ml-auto">
                                                    <ChevronRight size={14} />
                                                </motion.div>
                                            )}
                                        </button>
                                    );
                                })}
                            </nav>

                            <div className={cn(
                                "hidden md:flex mt-auto p-4 rounded-2xl items-center gap-3 border transition-colors duration-500",
                                settings.themeMode === 'light' ? 'bg-white border-zinc-200' : 'bg-black/40 border-white/10'
                            )}>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold truncate">Hamzeh Hamdan</p>
                                    <p className="text-[10px] opacity-40 truncate">Free Plan</p>
                                </div>
                                <Cloud size={14} className="text-emerald-500" />
                            </div>
                        </aside>

                        {/* Content Area */}
                        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                            {/* Header */}
                            <header className={cn(
                                "h-14 md:h-20 flex items-center justify-between px-4 md:px-8 border-b transition-colors duration-500 shrink-0",
                                settings.themeMode === 'light' ? 'border-zinc-100' : 'border-white/5'
                            )}>
                                <h3 className="font-bold text-base md:text-lg capitalize">{activeTab} Settings</h3>
                                <button
                                    onClick={onClose}
                                    className={cn(
                                        "p-2 rounded-full transition-all hover:scale-110 active:scale-95",
                                        settings.themeMode === 'light' ? 'hover:bg-zinc-100' : 'hover:bg-white/5'
                                    )}
                                >
                                    <X size={20} />
                                </button>
                            </header>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                                {activeTab === "workspace" && (
                                    <div className="space-y-10">
                                        <section className="space-y-4">
                                            <h4 className="font-bold text-sm">Identity & Branding</h4>
                                            <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 transition-all focus-within:border-primary/40">
                                                <User size={18} className="text-white/20" />
                                                <input
                                                    type="text"
                                                    value={settings.userName}
                                                    onChange={(e) => setSettings({ ...settings, userName: e.target.value })}
                                                    placeholder="Your Neural Identity"
                                                    className="bg-transparent flex-1 outline-none text-sm font-bold"
                                                />
                                            </div>
                                        </section>

                                        <section className="space-y-4">
                                            <h4 className="font-bold text-sm">Network Visualization</h4>
                                            <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 transition-all">
                                                <User size={18} className="text-white/40" />
                                                <div className="flex-1">
                                                    <span className="text-sm font-bold block">Show Nicknames</span>
                                                    <span className="text-xs opacity-40">Display informal aliases on network nodes</span>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={settings.showNicknames}
                                                    onChange={(e) => setSettings({ ...settings, showNicknames: e.target.checked })}
                                                    className="w-5 h-5 accent-primary"
                                                />
                                            </label>
                                        </section>

                                        <section className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-bold text-sm">Background Engine</h4>
                                                    <p className="text-xs opacity-40">Choose or upload a space-optimized wallpaper</p>
                                                </div>
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className={cn(
                                                        "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all hover:scale-105 active:scale-95",
                                                        settings.themeMode === 'light' ? 'bg-zinc-100 border-zinc-200' : 'bg-white/5 border-white/10'
                                                    )}
                                                >
                                                    <Upload size={14} /> Upload Image
                                                </button>
                                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                                            </div>

                                            <div className="flex gap-4">
                                                <input
                                                    type="text"
                                                    value={settings.background}
                                                    onChange={(e) => setSettings({ ...settings, background: e.target.value })}
                                                    className={cn(
                                                        "flex-1 rounded-2xl px-4 py-3 text-sm outline-none border transition-all",
                                                        settings.themeMode === 'light' ? 'bg-zinc-50 border-zinc-200 focus:border-zinc-900' : 'bg-white/5 border-white/10 focus:border-white/40'
                                                    )}
                                                    placeholder="Enter Image URL..."
                                                />
                                            </div>

                                            {settings.recentBackgrounds?.length > 0 && (
                                                <div className="space-y-3">
                                                    <span className="text-[10px] font-bold opacity-30 flex items-center gap-1">
                                                        <History size={10} /> RECENTLY USED
                                                    </span>
                                                    <div className="grid grid-cols-8 gap-2">
                                                        {settings.recentBackgrounds.map((bg, idx) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => setSettings({ ...settings, background: bg })}
                                                                className={cn(
                                                                    "aspect-square rounded-xl border-2 transition-all hover:scale-110 bg-cover bg-center shadow-lg",
                                                                    settings.background === bg ? (settings.themeMode === 'light' ? 'border-zinc-900' : 'border-white') : 'border-transparent'
                                                                )}
                                                                style={{ backgroundImage: `url(${bg})` }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </section>

                                        <section className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-bold text-sm">Philosophical Nodes</h4>
                                                    <p className="text-xs opacity-40">Manage quotes and daily affirmations</p>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Only Faves</span>
                                                        <input
                                                            type="checkbox"
                                                            checked={settings.onlyShowFavoriteQuotes}
                                                            onChange={(e) => setSettings({ ...settings, onlyShowFavoriteQuotes: e.target.checked })}
                                                            className="w-4 h-4 accent-primary"
                                                        />
                                                    </label>
                                                    <button
                                                        onClick={() => setSettings({ ...settings, showQuotes: !settings.showQuotes })}
                                                        className={cn(
                                                            "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                                            settings.showQuotes ? "bg-primary text-black" : "bg-white/5 text-white/40"
                                                        )}
                                                    >
                                                        {settings.showQuotes ? "Quotes Active" : "Cycle Mode"}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                {settings.quotes.map((quote) => (
                                                    <div key={quote.id} className="group bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                                                        <button
                                                            onClick={() => setSettings({
                                                                ...settings,
                                                                quotes: settings.quotes.map(q => q.id === quote.id ? { ...q, isFavorite: !q.isFavorite } : q)
                                                            })}
                                                            className={cn("transition-colors", quote.isFavorite ? "text-pink-500" : "text-white/20 hover:text-white/40")}
                                                        >
                                                            <Heart size={16} fill={quote.isFavorite ? "currentColor" : "none"} />
                                                        </button>
                                                        <div className="flex-1 min-w-0">
                                                            <input
                                                                value={quote.text}
                                                                onChange={(e) => setSettings({
                                                                    ...settings,
                                                                    quotes: settings.quotes.map(q => q.id === quote.id ? { ...q, text: e.target.value } : q)
                                                                })}
                                                                className="bg-transparent w-full outline-none text-xs font-medium truncate focus:text-white"
                                                            />
                                                            <div className="flex items-center gap-3 mt-1">
                                                                <input
                                                                    value={quote.author}
                                                                    onChange={(e) => setSettings({
                                                                        ...settings,
                                                                        quotes: settings.quotes.map(q => q.id === quote.id ? { ...q, author: e.target.value } : q)
                                                                    })}
                                                                    className="bg-transparent text-[9px] opacity-30 outline-none w-24"
                                                                />
                                                                <span className="text-[9px] opacity-10">|</span>
                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-[9px] opacity-20 uppercase font-bold tracking-tighter">Dur</span>
                                                                    <input
                                                                        type="number"
                                                                        value={quote.displayDuration || 10}
                                                                        onChange={(e) => setSettings({
                                                                            ...settings,
                                                                            quotes: settings.quotes.map(q => q.id === quote.id ? { ...q, displayDuration: parseInt(e.target.value) } : q)
                                                                        })}
                                                                        className="bg-transparent text-[9px] text-primary outline-none w-8 font-bold"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => setSettings({
                                                                ...settings,
                                                                quotes: settings.quotes.filter(q => q.id !== quote.id)
                                                            })}
                                                            className="opacity-0 group-hover:opacity-100 p-2 text-white/20 hover:text-red-400 transition-all"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() => {
                                                        const newQuote = {
                                                            id: Math.random().toString(),
                                                            text: "New Neural Node",
                                                            author: "Author",
                                                            isFavorite: false,
                                                            order: settings.quotes.length,
                                                            displayDuration: 10
                                                        };
                                                        setSettings({ ...settings, quotes: [...settings.quotes, newQuote] });
                                                    }}
                                                    className="w-full border border-dashed border-white/10 rounded-2xl py-3 text-[10px] font-black uppercase tracking-[0.2em] opacity-30 hover:opacity-100 transition-all hover:bg-white/5"
                                                >
                                                    + Inject Quote
                                                </button>
                                            </div>
                                        </section>

                                        <section className="space-y-4">
                                            <h4 className="font-bold text-sm">Primary Accent</h4>
                                            <div className="flex items-center gap-6">
                                                <input
                                                    type="color"
                                                    value={settings.primaryColor}
                                                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                                                    className="w-16 h-16 bg-transparent cursor-pointer rounded-2xl border-none outline-none appearance-none"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex justify-between mb-2">
                                                        <span className="text-xs font-bold opacity-40">PRIMARY THEME COLOR</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {['#FF5F5F', '#5FFF9F', '#5F9FFF', '#FFD85F', '#A35FFF', '#ffffff'].map(c => (
                                                            <button
                                                                key={c}
                                                                onClick={() => setSettings({ ...settings, primaryColor: c })}
                                                                className="w-8 h-8 rounded-full border border-white/10 shadow-lg transition-transform hover:scale-110 active:scale-95"
                                                                style={{ backgroundColor: c }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </section>

                                        <section className="space-y-4">
                                            <h4 className="font-bold text-sm">Secondary Accent</h4>
                                            <div className="flex items-center gap-6">
                                                <input
                                                    type="color"
                                                    value={settings.secondaryColor || '#5FFF9F'}
                                                    onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                                                    className="w-16 h-16 bg-transparent cursor-pointer rounded-2xl border-none outline-none appearance-none"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex justify-between mb-2">
                                                        <span className="text-xs font-bold opacity-40">CHECKLISTS & AI BOT COLOR</span>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {['#5FFF9F', '#FF5F5F', '#5F9FFF', '#FFD85F', '#A35FFF', '#ffffff'].map(c => (
                                                            <button
                                                                key={c}
                                                                onClick={() => setSettings({ ...settings, secondaryColor: c })}
                                                                className="w-8 h-8 rounded-full border border-white/10 shadow-lg transition-transform hover:scale-110 active:scale-95"
                                                                style={{ backgroundColor: c }}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </section>
                                    </div>
                                )}

                                {activeTab === "appearance" && (
                                    <div className="space-y-10">
                                        <section className="space-y-4">
                                            <h4 className="font-bold text-sm">Interface Mode</h4>
                                            <div className={cn(
                                                "p-1.5 rounded-2xl border flex gap-1",
                                                settings.themeMode === 'light' ? 'bg-zinc-100 border-zinc-200' : 'bg-white/[0.02] border-white/5'
                                            )}>
                                                {[
                                                    { id: 'light', label: 'Light', icon: Sun },
                                                    { id: 'dark', label: 'Dark', icon: Moon },
                                                    { id: 'system', label: 'System', icon: Monitor }
                                                ].map(mode => (
                                                    <button
                                                        key={mode.id}
                                                        onClick={() => setSettings({ ...settings, themeMode: mode.id as DashboardSettings["themeMode"] })}
                                                        className={cn(
                                                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all",
                                                            settings.themeMode === mode.id
                                                                ? (settings.themeMode === 'light' ? 'bg-white shadow-xl text-zinc-900' : 'bg-zinc-800 shadow-xl text-white')
                                                                : "opacity-40 hover:opacity-100"
                                                        )}
                                                    >
                                                        <mode.icon size={14} /> {mode.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </section>

                                        <section className="space-y-6">
                                            <h4 className="font-bold text-sm">Glassmorphism Engine</h4>
                                            <div className="space-y-8">
                                                <div className="space-y-3">
                                                    <div className="flex justify-between text-[10px] font-bold opacity-40 tracking-widest">
                                                        <span>SURFACE OPACITY</span>
                                                        <span>{settings.glassOpacity}%</span>
                                                    </div>
                                                    <input
                                                        type="range" min="5" max="95" value={settings.glassOpacity}
                                                        onChange={(e) => setSettings({ ...settings, glassOpacity: parseInt(e.target.value) })}
                                                        className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer accent-primary"
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between text-[10px] font-bold opacity-40 tracking-widest">
                                                        <span>BACKGROUND BLUR</span>
                                                        <span>{settings.glassBlur}PX</span>
                                                    </div>
                                                    <input
                                                        type="range" min="0" max="40" value={settings.glassBlur}
                                                        onChange={(e) => setSettings({ ...settings, glassBlur: parseInt(e.target.value) })}
                                                        className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer accent-primary"
                                                    />
                                                </div>
                                            </div>
                                        </section>

                                        <section className="space-y-4">
                                            <h4 className="font-bold text-sm">System Typography</h4>
                                            <div className="grid grid-cols-2 gap-3">
                                                {fonts.map((f) => (
                                                    <button
                                                        key={f.value}
                                                        onClick={() => setSettings({ ...settings, font: f.value })}
                                                        className={cn(
                                                            "px-6 py-4 rounded-2xl border text-left transition-all hover:scale-[1.02] active:scale-[0.98]",
                                                            settings.font === f.value
                                                                ? (settings.themeMode === 'light' ? 'bg-zinc-900 text-white' : 'bg-white text-black border-white')
                                                                : (settings.themeMode === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border-white/5 hover:border-white/20')
                                                        )}
                                                        style={{ fontFamily: f.value }}
                                                    >
                                                        <span className="text-sm font-bold block mb-0.5">{f.name}</span>
                                                        <span className="text-[10px] opacity-40 tracking-tight">System Primary Web Font</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </section>
                                    </div>
                                )}

                                {activeTab === "modules" && (
                                    <div className="space-y-6">
                                        <p className="text-xs opacity-40 mb-2">Enable or disable core dashboard modules</p>
                                        <div className="space-y-3">
                                            {[
                                                { id: "clock", name: "Dynamic Clock Node", desc: "Real-time date and time display" },
                                                { id: "focus", name: "Daily Intentions", desc: "Interactive priority focus input" },
                                                { id: "tasks", name: "Task Stream", desc: "Recent items and progress overview" },
                                                { id: "calendar", name: "Workspace Calendar", desc: "GCal sync with event visualization" },
                                            ].map((module) => (
                                                <label
                                                    key={module.id}
                                                    className={cn(
                                                        "flex items-center justify-between p-5 rounded-3xl border cursor-pointer transition-all hover:scale-[1.01]",
                                                        settings.themeMode === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border-white/5'
                                                    )}
                                                >
                                                    <div>
                                                        <span className="text-sm font-bold block">{module.name}</span>
                                                        <span className="text-xs opacity-40">{module.desc}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={settings.widgets?.includes(module.id)}
                                                            onChange={(e) => {
                                                                const widgets = settings.widgets || [];
                                                                if (e.target.checked) {
                                                                    setSettings({ ...settings, widgets: [...widgets, module.id] });
                                                                } else {
                                                                    setSettings({ ...settings, widgets: widgets.filter((w: string) => w !== module.id) });
                                                                }
                                                            }}
                                                            className="w-10 h-10 accent-zinc-900 border-none transition-all cursor-pointer"
                                                        />
                                                    </div>
                                                </label>
                                            ))}

                                            <div className={cn(
                                                "flex items-center justify-between p-5 rounded-3xl border transition-all mt-6",
                                                settings.themeMode === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border-white/5'
                                            )}>
                                                <div>
                                                    <span className="text-sm font-bold block">Climate Scale</span>
                                                    <span className="text-xs opacity-40">Set global temperature metric</span>
                                                </div>
                                                <div className="flex gap-1 bg-black/20 p-1 rounded-xl border border-white/5">
                                                    {(['F', 'C'] as const).map(u => (
                                                        <button
                                                            key={u}
                                                            onClick={() => setSettings({ ...settings, weatherUnit: u })}
                                                            className={cn(
                                                                "px-4 py-1.5 rounded-lg text-[10px] font-black transition-all",
                                                                (settings.weatherUnit || 'F') === u ? "bg-white text-black" : "text-white/40 hover:text-white"
                                                            )}
                                                        >
                                                            °{u}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <label className={cn(
                                                "flex items-center justify-between p-5 rounded-3xl border cursor-pointer transition-all hover:scale-[1.01] mt-3",
                                                settings.themeMode === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border-white/5'
                                            )}>
                                                <div>
                                                    <span className="text-sm font-bold block">Autonomous Memory Sync</span>
                                                    <span className="text-xs opacity-40">AI suggests connections between notes, tasks, and contacts</span>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={settings.autonomousSync ?? false}
                                                    onChange={(e) => setSettings({ ...settings, autonomousSync: e.target.checked })}
                                                    className="w-10 h-10 accent-zinc-900 border-none transition-all cursor-pointer"
                                                />
                                            </label>

                                            <label className={cn(
                                                "flex items-center justify-between p-5 rounded-3xl border cursor-pointer transition-all hover:scale-[1.01] mt-3",
                                                settings.themeMode === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border-white/5'
                                            )}>
                                                <div>
                                                    <span className="text-sm font-bold block">External Search Handling</span>
                                                    <span className="text-xs opacity-40">Open Google searches in a new browser tab</span>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={settings.openSearchInNewTab ?? false}
                                                    onChange={(e) => setSettings({ ...settings, openSearchInNewTab: e.target.checked })}
                                                    className="w-10 h-10 accent-zinc-900 border-none transition-all cursor-pointer"
                                                />
                                            </label>

                                            <label className={cn(
                                                "flex items-center justify-between p-5 rounded-3xl border cursor-pointer transition-all hover:scale-[1.01] mt-3",
                                                settings.themeMode === 'light' ? 'bg-zinc-50 border-zinc-200' : 'bg-white/5 border-white/5'
                                            )}>
                                                <div>
                                                    <span className="text-sm font-bold block">Search by Default</span>
                                                    <span className="text-xs opacity-40">Main input searches Google instead of setting focus (use &apos;f: goal&apos; for focus)</span>
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={settings.defaultToSearch ?? false}
                                                    onChange={(e) => setSettings({ ...settings, defaultToSearch: e.target.checked })}
                                                    className="w-10 h-10 accent-zinc-900 border-none transition-all cursor-pointer"
                                                />
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "account" && (
                                    <div className="space-y-10">
                                        <section className="space-y-4 p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-emerald-500 rounded-2xl text-white">
                                                    <Database size={24} />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-sm text-emerald-500">Cloud Sync Active</h4>
                                                    <p className="text-xs opacity-60">Last synchronized: Just now</p>
                                                </div>
                                                <button className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-500 text-xs font-bold flex items-center gap-2">
                                                    <RefreshCcw size={14} /> Sync Now
                                                </button>
                                            </div>
                                        </section>

                                        <div className="grid grid-cols-2 gap-6">
                                            <section className="p-6 rounded-3xl border border-white/5 space-y-4">
                                                <h4 className="font-bold text-sm">Data Export</h4>
                                                <p className="text-xs opacity-40">Download your personal OS data as JSON</p>
                                                <button className="w-full py-3 rounded-2xl bg-zinc-100 dark:bg-white/5 text-xs font-bold flex items-center justify-center gap-2">
                                                    <Download size={14} /> Export Backup
                                                </button>
                                            </section>
                                            <section className="p-6 rounded-3xl border border-red-500/10 space-y-4">
                                                <h4 className="font-bold text-sm text-red-500">Emergency Reset</h4>
                                                <p className="text-xs opacity-40">Wipe all local and cloud configurations</p>
                                                <button className="w-full py-3 rounded-2xl bg-red-500/10 text-red-500 text-xs font-bold flex items-center justify-center gap-2">
                                                    <Trash2 size={14} /> Factory Reset
                                                </button>
                                            </section>
                                        </div>

                                        <div className="flex items-start gap-4 p-6 rounded-3xl bg-zinc-100 dark:bg-white/5 border border-white/5">
                                            <AlertCircle size={20} className="text-amber-500 shrink-0" />
                                            <div>
                                                <h4 className="font-bold text-xs">Beta Environment</h4>
                                                <p className="text-[10px] opacity-40 leading-relaxed mt-1">
                                                    You are currently using the development version of the OS. Features like GCal sync and Realtime DB are in public preview. Data may be periodically reset.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === "integrations" && (
                                    <div className="space-y-8">
                                        <section className="bg-white/5 border border-white/10 rounded-3xl p-8 flex items-center justify-between group">
                                            <div className="flex items-center gap-6">
                                                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white/40 group-hover:text-primary transition-colors">
                                                    <CalendarIcon size={32} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-lg mb-1">Google Calendar Sync</h4>
                                                    <p className="text-xs opacity-40">Inject your events directly into the Strategic Briefing</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    if (settings.gcalConnected) {
                                                        setSettings({ ...settings, gcalConnected: false });
                                                    } else {
                                                        const { data, error } = await supabase.auth.signInWithOAuth({
                                                            provider: 'google',
                                                            options: {
                                                                queryParams: {
                                                                    access_type: 'offline',
                                                                    prompt: 'consent',
                                                                },
                                                                scopes: 'https://www.googleapis.com/auth/calendar.readonly',
                                                                redirectTo: `${window.location.origin}/dashboard`
                                                            }
                                                        });
                                                        if (error) console.error("Auth error:", error);
                                                        // Note: gcalConnected will be updated via auth listener in Shell
                                                    }
                                                }}
                                                className={cn(
                                                    "px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95",
                                                    settings.gcalConnected ? "bg-white text-black" : "bg-primary text-black"
                                                )}
                                            >
                                                {settings.gcalConnected ? "Disconnect Node" : "Link Account"}
                                            </button>
                                        </section>

                                        <div className="grid grid-cols-2 gap-6 opacity-30 pointer-events-none grayscale">
                                            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                                                <div className="flex gap-4 mb-4">
                                                    <div className="w-10 h-10 rounded-full bg-blue-500" />
                                                    <h4 className="font-bold text-xs self-center">Twitter Feed</h4>
                                                </div>
                                                <p className="text-[10px] opacity-40 uppercase font-black tracking-widest">Available Q3</p>
                                            </div>
                                            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                                                <div className="flex gap-4 mb-4">
                                                    <div className="w-10 h-10 rounded-full bg-emerald-500" />
                                                    <h4 className="font-bold text-xs self-center">Notion Ingest</h4>
                                                </div>
                                                <p className="text-[10px] opacity-40 uppercase font-black tracking-widest">Available Q3</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <footer className={cn(
                                "h-24 flex items-center justify-end px-8 gap-4 border-t transition-colors duration-500",
                                settings.themeMode === 'light' ? 'bg-zinc-50 border-zinc-100' : 'bg-black/20 border-white/5'
                            )}>
                                <button
                                    onClick={onClose}
                                    className="text-sm font-bold opacity-40 hover:opacity-100 transition-opacity"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSyncing}
                                    className={cn(
                                        "min-w-[180px] h-14 rounded-2xl font-bold shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50",
                                        settings.themeMode === 'light' ? 'bg-zinc-900 text-white hover:bg-zinc-800' : 'bg-white text-black hover:bg-zinc-100'
                                    )}
                                >
                                    {isSyncing ? (
                                        <>
                                            <RefreshCcw size={20} className="animate-spin" />
                                            Synchronizing...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={20} />
                                            Confirm Changes
                                        </>
                                    )}
                                </button>
                            </footer>
                        </main>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
