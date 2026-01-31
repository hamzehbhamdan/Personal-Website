"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { CheckCircle2, Circle, Calendar, Newspaper, Quote, ArrowRight, Plus, Sparkles, RefreshCw, Trash2, Brain as BrainIcon, FileText, Target as TargetIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import { DashboardSettings, Task, Quote as QuoteType } from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { FocusTimerPopUp } from "./FocusTimerPopUp";
import { QuickNotesPopUp } from "./QuickNotesPopUp";
import { QuickTasksPopUp } from "./QuickTasksPopUp";
import { StrategicBriefingPopUp } from "./StrategicBriefingPopUp";
import { NeuralChatPopUp } from "./NeuralChatPopUp";
import { QuickCalendarPopUp } from "./QuickCalendarPopUp";
import { toast } from "sonner";
import { FocusSession } from "@/lib/types";

const QuickCommTerminal = ({ onSubmit }: { onSubmit: (val: string) => void }) => {
    const [input, setInput] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(0);

    const commands = [
        { cmd: "task:", desc: "Create new task" },
        { cmd: "note:", desc: "Quick note" },
        { cmd: "focus", desc: "Start focus session" },
        { cmd: "help", desc: "Show commands" },
        { cmd: "theme", desc: "Toggle theme" }
    ];

    const filtered = input
        ? commands.filter(c => c.cmd.toLowerCase().startsWith(input.toLowerCase().split(' ')[0]))
        : commands.slice(0, 4);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim()) return;
        onSubmit(input);
        setInput("");
        setShowSuggestions(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setFocusedIndex(prev => (prev + 1) % filtered.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setFocusedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
        } else if (e.key === 'Tab') {
            e.preventDefault();
            if (filtered[focusedIndex]) {
                setInput(filtered[focusedIndex].cmd + " ");
            }
        } else if (e.key === 'Enter' && showSuggestions && filtered.length > 0 && !input.includes(' ')) {
            // If strictly selecting a command but haven't typed params yet
            // Actually, enter should just submit mostly, unless we want to autocomplete.
            // Let's stick to standard behavior: Enter submits. Tab autocompletes.
        }
    };

    return (
        <div className="relative group flex flex-col items-end gap-1">
            <span
                onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
                className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20 group-hover:text-primary/60 transition-colors cursor-pointer hover:text-primary"
            >
                Quick Comm
            </span>
            <div className="relative">
                {/* Suggestions Popup */}
                <AnimatePresence>
                    {showSuggestions && filtered.length > 0 && input && !input.includes(' ') && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-full mb-2 right-0 w-[200px] bg-black/80 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden shadow-2xl z-50"
                        >
                            {filtered.map((c, i) => (
                                <div
                                    key={c.cmd}
                                    onClick={() => {
                                        setInput(c.cmd + " ");
                                        document.getElementById('quick-comm-input')?.focus();
                                        setFocusedIndex(0);
                                    }}
                                    className={cn(
                                        "px-3 py-2 text-xs cursor-pointer flex justify-between items-center transition-colors",
                                        i === focusedIndex ? "bg-white/10 text-primary" : "text-white/60 hover:bg-white/5"
                                    )}
                                >
                                    <span className="font-mono font-bold">{c.cmd}</span>
                                    <span className="text-[9px] opacity-50 uppercase tracking-wider">{c.desc}</span>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-center gap-2 bg-black/20 backdrop-blur-sm border border-white/5 pl-2 pr-4 py-1.5 rounded-lg transition-all focus-within:border-primary/50 focus-within:bg-black/40 hover:border-white/10 w-[200px]">
                    <span className="text-primary font-bold text-xs animate-pulse">{'>'}</span>
                    <form onSubmit={handleSubmit} className="flex-1">
                        <input
                            id="quick-comm-input"
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                setFocusedIndex(0);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            onKeyDown={handleKeyDown}
                            type="text"
                            placeholder="Execute..."
                            autoComplete="off"
                            className="w-full bg-transparent outline-none text-xs font-mono text-white placeholder:text-white/20"
                        />
                    </form>
                </div>
            </div>
        </div>
    );
};

export function MomentumView({ settings, setSettings, tasks, setTasks }: { settings: DashboardSettings, setSettings: React.Dispatch<React.SetStateAction<DashboardSettings>>, tasks: Task[], setTasks: React.Dispatch<React.SetStateAction<Task[]>> }) {
    const supabase = createSupabaseBrowserClient();
    const [time, setTime] = useState(new Date());
    const [focus, setFocus] = useState("");

    // Helper to toggle theme
    const toggleTheme = () => {
        setSettings(prev => ({
            ...prev,
            themeMode: prev.themeMode === 'dark' ? 'light' : 'dark'
        }));
    };
    const [isFocusSet, setIsFocusSet] = useState(false);
    const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
    const [topTask, setTopTask] = useState<Task | null>(null);
    const [completedToday, setCompletedToday] = useState(0);
    const [totalTodayTasks, setTotalTodayTasks] = useState(0);
    const [isTasksExpanded, setIsTasksExpanded] = useState(false);
    const [briefing, setBriefing] = useState<string | null>(null);
    const [isBriefingLoading, setIsBriefingLoading] = useState(false);
    const [isFocusOpen, setIsFocusOpen] = useState(false);
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    const [isTasksOpen, setIsTasksOpen] = useState(false);
    const [isBriefingOpen, setIsBriefingOpen] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [focusedToday, setFocusedToday] = useState(0);

    const fetchFocusStats = useCallback(async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { data } = await supabase
            .from('focus_sessions')
            .select('duration')
            .gte('created_at', today.toISOString());

        if (data) {
            const total = data.reduce((acc, curr) => acc + curr.duration, 0);
            setFocusedToday(total);
        }
    }, []);

    useEffect(() => {
        fetchFocusStats();
    }, [fetchFocusStats]);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Listen for global command events
    useEffect(() => {
        const handleOpenCalendar = () => setIsCalendarOpen(true);
        const handleStartFocus = () => setIsFocusOpen(true);
        const handleOpenNotes = () => setIsNotesOpen(true);

        window.addEventListener('open-calendar-popup', handleOpenCalendar);
        window.addEventListener('start-focus-session', handleStartFocus);
        window.addEventListener('open-quick-notes', handleOpenNotes);

        return () => {
            window.removeEventListener('open-calendar-popup', handleOpenCalendar);
            window.removeEventListener('start-focus-session', handleStartFocus);
            window.removeEventListener('open-quick-notes', handleOpenNotes);
        };
    }, []);

    useEffect(() => {
        const fetchTasks = async () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Fetch all tasks created today or with due date today
            const { data } = await supabase
                .from('tasks')
                .select('*, subtasks(*)')
                .order('created_at', { ascending: false });

            if (data) {
                const mappedTasks = data.map(t => ({
                    ...t,
                    dueDate: t.due_date ? new Date(t.due_date) : null,
                    subtasks: t.subtasks || [],
                    tags: t.tags || [t.priority]
                }));
                setTasks(mappedTasks.slice(0, 5));

                // Find top priority task (not done, high priority or urgency)
                const pendingTasks = mappedTasks.filter(t => t.status !== 'done');
                const topPriority = pendingTasks.find(t => t.priority === 'high' || t.urgency === 'high')
                    || pendingTasks[0]
                    || null;
                setTopTask(topPriority);

                // Calculate today's completion stats
                const todayTasks = mappedTasks.filter(t => {
                    const createdAt = new Date(t.created_at);
                    return createdAt >= today;
                });
                setTotalTodayTasks(todayTasks.length);
                setCompletedToday(todayTasks.filter(t => t.status === 'done').length);
            }
        };
        fetchTasks();
    }, []);

    // Fetch AI Briefing on mount or if stale
    const fetchBriefing = useCallback(async () => {
        setIsBriefingLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            let token = session?.provider_token;
            if (!token && typeof window !== 'undefined') {
                token = localStorage.getItem('google_provider_token') || undefined;
            }

            const res = await fetch("/api/briefing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    weatherUnit: settings.weatherUnit,
                    userName: settings.userName,
                    token // Pass token explicitly
                })
            });
            if (res.ok) {
                const data = await res.json();
                setBriefing(data.briefing);
            }
        } catch (e) {
            console.error("Briefing failed", e);
        } finally {
            setIsBriefingLoading(false);
        }
    }, [settings.weatherUnit, settings.userName]);

    useEffect(() => {
        const today = new Date().toDateString();
        const lastBriefingAt = localStorage.getItem('last-briefing-at');

        if (lastBriefingAt === today && briefing) return;

        fetchBriefing();
        localStorage.setItem('last-briefing-at', today);
    }, [fetchBriefing, briefing]);

    const toggleTask = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === "done" ? "todo" : "done";
        setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus as any } : t));
        await supabase.from('tasks').update({ status: newStatus }).eq('id', id);
    };

    const deleteTask = async (id: string) => {
        setTasks(tasks.filter(t => t.id !== id));
        await supabase.from('tasks').delete().eq('id', id);
    };

    const completionRate = tasks.length > 0 ? (tasks.filter(t => t.status === 'done').length / tasks.length) * 100 : 0;

    const relevantQuotes = settings.onlyShowFavoriteQuotes
        ? settings.quotes.filter(q => q.isFavorite)
        : settings.quotes;

    useEffect(() => {
        if (settings.showQuotes && relevantQuotes.length > 0) {
            const currentQuote = relevantQuotes[currentQuoteIndex];
            const duration = (currentQuote?.displayDuration || 10) * 1000;
            const quoteTimer = setTimeout(() => {
                setCurrentQuoteIndex((prev) => (prev + 1) % relevantQuotes.length);
            }, duration);
            return () => clearTimeout(quoteTimer);
        }
    }, [currentQuoteIndex, settings.showQuotes, relevantQuotes]);

    const greeting = () => {
        const hour = time.getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    const showClock = settings.widgets?.includes("clock");
    const showFocus = settings.widgets?.includes("focus");
    const showTasks = settings.widgets?.includes("tasks");
    const showCalendar = settings.widgets?.includes("calendar");

    const currentQuote = relevantQuotes[currentQuoteIndex];

    return (
        <div className="flex flex-col items-center justify-center h-full w-full text-black dark:text-white relative z-10 px-10">
            {/* Top Area: Status Nodes (Outliers) */}
            <div className="absolute top-12 left-12 flex gap-12 z-50">
                {/* Date Node (First) */}
                <div className="flex flex-col gap-1 transition-all hover:opacity-100 opacity-60">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">System Date</span>
                    <span className="text-2xl font-bold tracking-tighter shrink-0">{format(time, "EEEE")}</span>
                    <span className="text-sm font-medium opacity-60 tracking-tight">{format(time, "MMMM do")}</span>
                </div>

                <div className="w-px h-12 bg-white/5 self-center" />

                {/* Weather Node (Second) */}
                <div className="w-48">
                    <WeatherWidget unit={settings.weatherUnit || 'F'} />
                </div>
            </div>

            {/* Top Right: (Empty for now) */}

            {/* Bottom Right: Daily Velocity Progress Ring */}
            <div className="absolute bottom-12 right-12 flex gap-6 z-50">
                {/* System Status & Velocity Group */}
                <div className="flex flex-col items-end gap-6 text-right">

                    {/* Velocity Ring */}
                    <div
                        onClick={() => setIsFocusOpen(true)}
                        className="flex flex-col items-center gap-2 transition-all hover:opacity-100 opacity-70 group relative cursor-pointer"
                    >
                        {/* <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary absolute -left-20 top-1/2 -translate-y-1/2 -rotate-90">Velocity</span> */}
                        <div className="relative w-16 h-16 transition-transform group-hover:scale-110">
                            <svg className="w-16 h-16 transform -rotate-90">
                                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                                <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={`${(totalTodayTasks > 0 ? (completedToday / totalTodayTasks) * 176 : 0)} 176`} strokeLinecap="round" className="text-primary transition-all duration-500" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-lg font-bold">{completedToday}</span>
                                <span className="text-[8px] opacity-40">/{totalTodayTasks}</span>
                            </div>
                        </div>
                        <div className="text-[9px] opacity-40 font-mono tracking-wider tabular-nums group-hover:text-primary transition-colors">
                            {Math.floor(focusedToday / 60).toString().padStart(2, '0')}:{focusedToday % 60 ? (focusedToday % 60).toString().padStart(2, '0') : '00'}
                        </div>
                    </div>

                    <div className="w-8 h-px bg-white/10" />

                    {/* Quick Comm Terminal (Updated) */}
                    <QuickCommTerminal
                        onSubmit={async (val) => {
                            try {
                                if (val.toLowerCase() === 'help') {
                                    toast.info("Terminal Commands:", {
                                        description: "note: <text>, task: <text>, focus, theme",
                                    });
                                    return;
                                }
                                if (val.toLowerCase() === 'focus') {
                                    setIsFocusOpen(true);
                                    return;
                                }
                                if (val.toLowerCase() === 'theme') {
                                    setSettings(prev => ({ ...prev, themeMode: prev.themeMode === 'dark' ? 'light' : 'dark' }));
                                    toast.success("Theme toggled.");
                                    return;
                                }

                                let title = val;
                                let type = 'task';

                                if (val.startsWith('note:')) {
                                    type = 'note';
                                    title = val.replace('note:', '').trim();
                                    await supabase.from('notes').insert([{ title, content: '', user_id: (await supabase.auth.getUser()).data.user?.id }]);
                                    toast.success("Note logged to neural net");
                                } else {
                                    // Task
                                    if (val.startsWith('task:')) title = val.replace('task:', '').trim();
                                    await supabase.from('tasks').insert([{
                                        title,
                                        status: 'todo',
                                        priority: 'medium',
                                        user_id: (await supabase.auth.getUser()).data.user?.id
                                    }]);
                                    toast.success("Directive initialized");
                                    setTotalTodayTasks(prev => prev + 1);
                                }
                            } catch (err) {
                                toast.error("Transmission failed");
                            }
                        }}
                    />

                </div>
            </div>

            {/* Bottom Left: Toolbelt (Column) */}
            <div className="absolute bottom-12 left-12 flex flex-col gap-4 z-[50]">
                {/* Focus Icon */}
                <button
                    onClick={() => setIsFocusOpen(true)}
                    className="group flex items-center gap-4 transition-all"
                >
                    <div className="p-3 glass rounded-2xl group-hover:bg-white/10 group-hover:scale-110 transition-all border-white/5 shadow-xl">
                        <TargetIcon size={20} className="opacity-40 group-hover:opacity-100 group-hover:text-primary transition-all" />
                    </div>
                </button>

                {/* Tasks Icon */}
                <button
                    onClick={() => setIsTasksOpen(true)}
                    className="group flex items-center gap-4 transition-all"
                >
                    <div className="p-3 glass rounded-2xl group-hover:bg-white/10 group-hover:scale-110 transition-all border-white/5 shadow-xl">
                        <CheckCircle2 size={20} className="opacity-40 group-hover:opacity-100 group-hover:text-primary transition-all" />
                    </div>
                </button>

                {/* Notes Icon */}
                <button
                    onClick={() => setIsNotesOpen(true)}
                    className="group flex items-center gap-4 transition-all"
                >
                    <div className="p-3 glass rounded-2xl group-hover:bg-white/10 group-hover:scale-110 transition-all border-white/5 shadow-xl">
                        <FileText size={20} className="opacity-40 group-hover:opacity-100 group-hover:text-primary transition-all" />
                    </div>
                </button>

                {/* AI Briefing Icon */}
                <button
                    onClick={() => setIsBriefingOpen(true)}
                    className="group flex items-center gap-4 transition-all"
                >
                    <div className="p-3 glass rounded-2xl group-hover:bg-white/10 group-hover:scale-110 transition-all border-white/5 shadow-xl">
                        <Sparkles size={20} className="opacity-40 group-hover:opacity-100 group-hover:text-primary transition-all" />
                    </div>
                </button>

                {/* Calendar Icon */}
                <button
                    onClick={() => setIsCalendarOpen(true)}
                    className="group flex items-center gap-4 transition-all"
                >
                    <div className="p-3 glass rounded-2xl group-hover:bg-white/10 group-hover:scale-110 transition-all border-white/5 shadow-xl">
                        <Calendar size={20} className="opacity-40 group-hover:opacity-100 group-hover:text-primary transition-all" />
                    </div>
                </button>
            </div>

            {/* Central Stage */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="text-center"
            >
                {showClock && (
                    <h1 className="text-[12rem] font-bold tracking-tighter leading-none select-none drop-shadow-2xl opacity-90 transition-all hover:opacity-100 hover:scale-[1.02] cursor-default">
                        {format(time, "HH:mm")}
                    </h1>
                )}

                <h2 className={`text-4xl font-light mt-4 mb-16 tracking-tight flex items-center justify-center gap-3 ${!showClock ? "text-6xl" : ""}`}>
                    {settings.showQuotes && currentQuote ? (
                        <AnimatePresence mode="wait">
                            <motion.span
                                key={currentQuote.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="italic opacity-80"
                            >
                                "{currentQuote.text}"
                                <span className="block text-xs font-bold uppercase tracking-widest mt-2 opacity-30">— {currentQuote.author}</span>
                            </motion.span>
                        </AnimatePresence>
                    ) : (
                        <>{greeting()}, <span className="font-semibold px-2">{settings.userName || "Human"}</span></>
                    )}
                </h2>

                {settings.showQuotes && (
                    <div className="absolute top-[-2rem] left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-20 uppercase tracking-[0.3em]">
                        {greeting()}, {settings.userName || "Human"}
                    </div>
                )}

                {showFocus && (
                    <div className="text-2xl font-light h-32 max-w-2xl mx-auto">
                        {!isFocusSet ? (
                            <div className="flex flex-col items-center gap-6">
                                <span className="opacity-40 italic text-xl">What is your core intention for today?</span>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={focus}
                                        onChange={(e) => setFocus(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && focus.trim()) {
                                                setIsFocusSet(true);
                                            }
                                        }}
                                        className="bg-transparent border-b border-white/20 text-center outline-none w-[600px] text-4xl pb-4 focus:border-white transition-all placeholder:text-white/10"
                                        autoFocus
                                        placeholder="Type intention and press Enter..."
                                    />
                                    <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                </div>
                            </div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center gap-4 group"
                            >
                                <span className="uppercase text-[10px] font-bold tracking-[0.3em] opacity-30">PRIMARY_NODE_ACTIVE</span>
                                <div className="flex items-center gap-6">
                                    <button
                                        onClick={() => setIsFocusSet(false)}
                                        className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-all"
                                    >
                                        <Circle size={20} />
                                    </button>
                                    <span className="text-5xl font-medium tracking-tight drop-shadow-lg">{focus}</span>
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}
            </motion.div>

            {/* Popups */}
            <FocusTimerPopUp
                isOpen={isFocusOpen}
                onClose={() => setIsFocusOpen(false)}
                onSessionComplete={(duration) => {
                    setFocusedToday(prev => prev + duration);
                    toast.success(`Focus session complete: ${Math.round(duration / 60)}m logged.`);
                }}
            />
            <QuickNotesPopUp
                isOpen={isNotesOpen}
                onClose={() => setIsNotesOpen(false)}
            />
            <QuickTasksPopUp
                isOpen={isTasksOpen}
                onClose={() => setIsTasksOpen(false)}
            />
            <StrategicBriefingPopUp
                isOpen={isBriefingOpen}
                onClose={() => setIsBriefingOpen(false)}
                briefing={briefing}
                isLoading={isBriefingLoading}
                onRefresh={fetchBriefing}
            />
            <NeuralChatPopUp
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
            />
            <QuickCalendarPopUp
                isOpen={isCalendarOpen}
                onClose={() => setIsCalendarOpen(false)}
            />
        </div>
    );
}

function WeatherWidget({ unit }: { unit: "C" | "F" }) {
    const [weather, setWeather] = useState<{ temp: number; condition: string } | null>(null);

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const unitParam = unit === 'F' ? '&temperature_unit=fahrenheit' : '';
                    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code${unitParam}`);
                    if (!res.ok) throw new Error(`Weather API returned ${res.status}`);
                    const data = await res.json();

                    // Simple weather code mapping
                    const code = data.current.weather_code;
                    let condition = "Clear";
                    if (code > 0 && code <= 3) condition = "Partly Cloudy";
                    if (code > 3 && code <= 48) condition = "Fog";
                    if (code > 48 && code <= 67) condition = "Drizzle";
                    if (code > 67 && code <= 77) condition = "Rain";
                    if (code > 77) condition = "Storm";

                    setWeather({
                        temp: Math.round(data.current.temperature_2m),
                        condition
                    });
                } catch (e) {
                    console.error("Weather fetch failed", e);
                }
            }, () => {
                // Default fallback (London)
                // If unit is F, convert 15C roughly to F (59)
                const defaultTemp = unit === 'F' ? 59 : 15;
                setWeather({ temp: defaultTemp, condition: "Cloudy" });
            });
        }
    }, [unit]);

    if (!weather) return null;

    return (
        <div className="flex flex-col gap-1 transition-all hover:opacity-100 opacity-60">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Weather Node</span>
            <span className="text-2xl font-bold tracking-tighter">{weather.temp}°{unit}</span>
            <span className="text-sm font-medium opacity-60 tracking-tight">{weather.condition}</span>
        </div>
    );
}
