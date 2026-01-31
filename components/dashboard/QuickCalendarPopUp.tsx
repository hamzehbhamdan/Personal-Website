"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    eachDayOfInterval
} from "date-fns";
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, Clock, Target, List, Grid } from "lucide-react";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Task } from "@/lib/types";

interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    start_time: string;
    end_time: string;
    location?: string;
    color?: string;
    htmlLink?: string;
    calendarId?: string;
}

interface Calendar {
    id: string;
    summary: string;
    backgroundColor: string;
    primary: boolean;
}

interface QuickCalendarPopUpProps {
    isOpen: boolean;
    onClose: () => void;
}

export function QuickCalendarPopUp({ isOpen, onClose }: QuickCalendarPopUpProps) {
    const supabase = createSupabaseBrowserClient();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [tasks, setTasks] = useState<Task[]>([]);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [view, setView] = useState<'grid' | 'agenda'>('agenda');
    const [calendars, setCalendars] = useState<Calendar[]>([]);
    const [activeCalendarIds, setActiveCalendarIds] = useState<Set<string>>(new Set());

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));


    // Calculate wider range: Current month +/- 1 month (approx 4 weeks+)
    // Actually user asked for prev 4 weeks and following 4 weeks.
    // Let's do startOfMonth - 1 month to endOfMonth + 1 month to cover nicely.
    // Re-declare monthStart for render logic
    const monthStart = startOfMonth(currentMonth);
    const displayStart = startOfWeek(subMonths(startOfMonth(currentMonth), 1));
    const displayEnd = endOfWeek(addMonths(endOfMonth(currentMonth), 1));

    // Reset to "right day" (Today) when opening
    useEffect(() => {
        if (isOpen) {
            const now = new Date();
            setCurrentMonth(now);
            setSelectedDate(now);
            // Re-fetch data for the new range? The main useEffect calls fetchData when isOpen changes.
            // But if we just update state here, it might trigger re-renders or fetch calls.
            // Let's rely on the main fetchData being called by the isOpen dependency.
        }
    }, [isOpen]);

    // Escape key listener to close popup
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isOpen && e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    const fetchData = async () => {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [tasksRes, eventsRes] = await Promise.all([
            supabase
                .from('tasks')
                .select('*')
                .eq('user_id', user.id)
                .not('due_date', 'is', null),
            supabase
                .from('calendar_events')
                .select('*')
                .eq('user_id', user.id)
        ]);

        // GCal Direct Fetch (All Calendars)
        try {
            const { data: { session } } = await supabase.auth.getSession();

            // Persistence: Try local storage if session token is missing
            let token = session?.provider_token;
            if (!token && typeof window !== 'undefined') {
                token = localStorage.getItem('google_provider_token') || undefined;
            } else if (token && typeof window !== 'undefined') {
                localStorage.setItem('google_provider_token', token);
            }

            if (token) {
                // 1. Get List of Calendars
                const calListRes = await fetch(`https://www.googleapis.com/calendar/v3/users/me/calendarList`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (calListRes.ok) {
                    const calListData = await calListRes.json();
                    const availableCalendars = calListData.items || [];

                    setCalendars(availableCalendars);

                    // Default all to active initially if not set
                    if (activeCalendarIds.size === 0) {
                        const ids = new Set<string>(availableCalendars.map((c: any) => c.id));
                        ids.add('tasks'); // Add 'tasks' as a virtual calendar ID
                        setActiveCalendarIds(ids);
                    }

                    // 2. Fetch events for each calendar (in parallel)
                    const allEventsPromises = availableCalendars.map(async (cal: any) => {
                        const eventsRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?timeMin=${displayStart.toISOString()}&timeMax=${displayEnd.toISOString()}&singleEvents=true&orderBy=startTime`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (eventsRes.ok) {
                            const data = await eventsRes.json();
                            return data.items?.map((item: any) => ({
                                id: item.id,
                                title: item.summary || 'Untitled Event',
                                description: item.description,
                                start_time: item.start.dateTime || item.start.date,
                                end_time: item.end.dateTime || item.end.date,
                                location: item.location,
                                color: cal.backgroundColor || '#4285F4',
                                htmlLink: item.htmlLink,
                                calendarId: cal.id
                            })) || [];
                        }
                        return [];
                    });

                    const results = await Promise.all(allEventsPromises);
                    const rawGoogleEvents = results.flat();

                    const combinedRaw = [...rawGoogleEvents, ...(eventsRes.data || [])];
                    const uniqueEvents = Array.from(
                        new Map(combinedRaw.map((item: any) => [item.id, item])).values() // Dedupe by ID
                    );

                    console.log(`[Calendar] Fetch stats: ${rawGoogleEvents.length} GCal raw, ${uniqueEvents.length} unique total.`);
                    setEvents(uniqueEvents as CalendarEvent[]);
                }
            }
        } catch (error) {
            console.error("GCal Sync Error:", error);
        }

        if (tasksRes.data) {
            setTasks(tasksRes.data.map((t: any) => ({
                ...t,
                dueDate: new Date(t.due_date)
            })));
        }

        setIsLoading(false);
    };

    useEffect(() => {
        if (isOpen) fetchData();
    }, [isOpen, currentMonth]); // Re-fetch if month changes to ensure we have data? Actually displayed data depends on currentMonth now.

    const days = eachDayOfInterval({
        start: displayStart,
        end: displayEnd
    });

    const isCalendarActive = (id: string) => activeCalendarIds.has(id);
    const toggleCalendar = (id: string) => {
        const newSet = new Set(activeCalendarIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setActiveCalendarIds(newSet);
    };

    const selectedDayTasks = tasks.filter(t => t.dueDate && isSameDay(t.dueDate, selectedDate) && isCalendarActive('tasks'));
    const selectedDayEvents = events.filter(e => isSameDay(new Date(e.start_time), selectedDate) && (e.calendarId ? isCalendarActive(e.calendarId) : true));

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-end justify-start p-8 pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 50, x: -50 }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 50, x: -50 }}
                        className="relative w-full max-w-sm glass border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl pointer-events-auto h-[600px] flex flex-col mb-24 ml-24"
                    >
                        {/* Header */}
                        <div className="p-8 flex justify-between items-center bg-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/20 rounded-xl">
                                    <CalendarIcon className="text-primary" size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold tracking-tight">Temporal Node</h3>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] block opacity-40">System Almanac</span>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors opacity-40 hover:opacity-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Calendar Controls */}
                        <div className="px-8 py-4 flex items-center justify-between border-b border-white/5">
                            <h4 className="text-lg font-bold tracking-tight">{format(currentMonth, "MMMM yyyy")}</h4>
                            <div className="flex gap-4 items-center">
                                {/* View Toggle */}
                                <div className="flex bg-white/5 p-1 rounded-lg">
                                    <button
                                        onClick={() => setView('grid')}
                                        className={cn("p-1.5 rounded-md transition-all", view === 'grid' ? "bg-primary text-black" : "text-white/40 hover:text-white")}
                                    >
                                        <Grid size={14} />
                                    </button>
                                    <button
                                        onClick={() => setView('agenda')}
                                        className={cn("p-1.5 rounded-md transition-all", view === 'agenda' ? "bg-primary text-black" : "text-white/40 hover:text-white")}
                                    >
                                        <List size={14} />
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={prevMonth} className="p-2 hover:bg-white/5 rounded-lg transition-all opacity-60 hover:opacity-100">
                                        <ChevronLeft size={18} />
                                    </button>
                                    <button onClick={nextMonth} className="p-2 hover:bg-white/5 rounded-lg transition-all opacity-60 hover:opacity-100">
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Calendar Legend / Filter */}
                        {calendars.length > 0 && (
                            <div className="px-8 py-2 overflow-x-auto scrollbar-hide flex gap-2 border-b border-white/5">
                                <button
                                    onClick={() => toggleCalendar('tasks')}
                                    className={cn(
                                        "px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border transition-all whitespace-nowrap flex items-center",
                                        activeCalendarIds.has('tasks')
                                            ? "bg-white/10 border-white/20 text-white"
                                            : "bg-transparent border-transparent text-white/20 hover:text-white/60"
                                    )}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block mr-1.5" />
                                    Tasks
                                </button>
                                {calendars.map(cal => (
                                    <button
                                        key={cal.id}
                                        onClick={() => toggleCalendar(cal.id)}
                                        className={cn(
                                            "px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border transition-all whitespace-nowrap flex items-center",
                                            activeCalendarIds.has(cal.id)
                                                ? "bg-white/10 border-white/20 text-white"
                                                : "bg-transparent border-transparent text-white/20 hover:text-white/60"
                                        )}
                                    >
                                        <span
                                            className="w-1.5 h-1.5 rounded-full inline-block mr-1.5"
                                            style={{ backgroundColor: cal.backgroundColor }}
                                        />
                                        {cal.summary}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Calendar Views */}
                        <div className="flex-1 p-6 overflow-hidden flex flex-col">
                            {view === 'grid' ? (
                                <>
                                    <div className="grid grid-cols-7 mb-4">
                                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                            <div key={day} className="text-center text-[10px] font-black uppercase tracking-widest opacity-20">
                                                {day}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-7 gap-1">
                                        {days.map((day, idx) => {
                                            const dayTasks = tasks.filter(t => t.dueDate && isSameDay(t.dueDate, day) && activeCalendarIds.has('tasks'));
                                            const dayEvents = events.filter(e => isSameDay(new Date(e.start_time), day) && (e.calendarId ? activeCalendarIds.has(e.calendarId) : true));

                                            const isSelected = isSameDay(day, selectedDate);
                                            const isToday = isSameDay(day, new Date());
                                            const isCurrentMonth = isSameMonth(day, monthStart);

                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={() => setSelectedDate(day)}
                                                    className={cn(
                                                        "aspect-square relative flex flex-col items-center justify-center rounded-xl text-sm transition-all cursor-pointer group",
                                                        !isCurrentMonth && "opacity-10",
                                                        isSelected && "bg-primary/20 ring-1 ring-primary/50 text-white font-bold",
                                                        isToday && !isSelected && "bg-white/10 text-primary font-bold shadow-lg",
                                                        !isSelected && !isToday && isCurrentMonth && "hover:bg-white/5"
                                                    )}
                                                >
                                                    <span className={cn(isToday && "text-primary")}>{format(day, "d")}</span>
                                                    {(dayTasks.length > 0 || dayEvents.length > 0) && isCurrentMonth && (
                                                        <div className="flex gap-0.5 mt-1">
                                                            {dayTasks.slice(0, 3).map((t, i) => (
                                                                <div
                                                                    key={`task-${i}`}
                                                                    className={cn(
                                                                        "w-1 h-1 rounded-full",
                                                                        t.priority === 'high' ? "bg-red-400" :
                                                                            t.priority === 'medium' ? "bg-amber-400" : "bg-blue-400"
                                                                    )}
                                                                />
                                                            ))}
                                                            {dayEvents.slice(0, 3).map((e, i) => (
                                                                <div
                                                                    key={`event-${idx}-${i}`}
                                                                    className="w-1 h-1 rounded-full bg-primary"
                                                                    title={e.title}
                                                                    style={{ backgroundColor: e.color }}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2 space-y-6">
                                    {/* Agenda View */}
                                    {days.filter(d => isSameMonth(d, monthStart)).map(day => {
                                        const dayEvents = events.filter(e => isSameDay(new Date(e.start_time), day) && (e.calendarId ? activeCalendarIds.has(e.calendarId) : true));
                                        const dayTasks = tasks.filter(t => t.dueDate && isSameDay(t.dueDate, day) && activeCalendarIds.has('tasks'));

                                        if (dayEvents.length === 0 && dayTasks.length === 0) return null;

                                        return (
                                            <div key={day.toISOString()} className="space-y-2">
                                                <div className="sticky top-0 bg-black/80 backdrop-blur-md z-10 py-1 border-b border-white/5">
                                                    <h5 className="text-[10px] font-black uppercase tracking-widest text-primary">
                                                        {format(day, "EEEE, MMM do")}
                                                    </h5>
                                                </div>
                                                {dayEvents.map((event, idx) => (
                                                    <div
                                                        key={`agenda-event-${event.id}-${idx}`}
                                                        className="p-3 bg-white/5 border border-white/5 rounded-xl flex gap-3 cursor-pointer hover:bg-white/10 transition-all"
                                                        onClick={() => window.open(event.htmlLink || `https://calendar.google.com/calendar`, '_blank')}
                                                    >
                                                        <div className="w-1 rounded-full" style={{ backgroundColor: event.color || '#4285F4' }} />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-xs font-bold text-white truncate">{event.title}</div>
                                                            <div className="text-[10px] opacity-40 font-mono">
                                                                {format(new Date(event.start_time), "HH:mm")} - {format(new Date(event.end_time), "HH:mm")}
                                                            </div>
                                                            <div className="text-[9px] opacity-30 mt-0.5 font-bold uppercase tracking-wider text-primary/80">
                                                                {calendars.find(c => c.id === event.calendarId)?.summary}
                                                            </div>
                                                            {event.location && (
                                                                <div className="text-[9px] opacity-30 mt-1 truncate">📍 {event.location}</div>
                                                            )}
                                                            {event.description && (
                                                                <div className="text-[9px] opacity-30 mt-1 line-clamp-2">{event.description}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                                {dayTasks.map(task => (
                                                    <div key={task.id} className="p-3 bg-white/5 border border-white/5 rounded-xl flex gap-3">
                                                        <div className={cn("w-1 rounded-full", task.priority === 'high' ? "bg-red-400" : task.priority === 'medium' ? "bg-amber-400" : "bg-blue-400")} />
                                                        <div>
                                                            <div className="text-xs font-bold text-white">{task.title}</div>
                                                            <div className="text-[10px] opacity-40">Task • {task.priority}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                    {events.filter(e => isSameMonth(new Date(e.start_time), monthStart) && (e.calendarId ? activeCalendarIds.has(e.calendarId) : true)).length === 0 &&
                                        tasks.filter(t => t.dueDate && isSameMonth(t.dueDate, monthStart) && activeCalendarIds.has('tasks')).length === 0 && (
                                            <div className="text-center py-10 opacity-30 italic text-xs">No agenda items found for this month with current filters.</div>
                                        )}
                                </div>
                            )}

                            {/* Events List for Selected Day (Only in Grid View) */}
                            {view === 'grid' && (
                                <div className="mt-8 flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 block mb-3">
                                        {isSameDay(selectedDate, new Date()) ? "Today's Protocol" : format(selectedDate, "MMM do") + " Schedule"}
                                    </span>

                                    {selectedDayTasks.length === 0 && selectedDayEvents.length === 0 ? (
                                        <div className="text-center py-6 glass border border-white/5 rounded-2xl opacity-20 italic text-[10px]">
                                            No scheduled activities.
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {/* Events First */}
                                            {selectedDayEvents.map(event => (
                                                <div
                                                    key={event.id}
                                                    className="p-3 glass border border-white/5 rounded-2xl flex items-center justify-between group hover:bg-white/5 transition-all bg-primary/5 cursor-pointer"
                                                    onClick={() => window.open(event.htmlLink || `https://calendar.google.com/calendar`, '_blank')}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: event.color || '#4285F4', color: event.color || '#4285F4' }} />
                                                        <div>
                                                            <span className="text-xs font-bold text-white group-hover:text-primary transition-colors block">
                                                                {event.title}
                                                            </span>
                                                            <span className="text-[9px] opacity-40 font-mono block">
                                                                {format(new Date(event.start_time), "HH:mm")} - {format(new Date(event.end_time), "HH:mm")}
                                                            </span>
                                                            <span className="text-[9px] opacity-30 mt-0.5 font-bold uppercase tracking-wider block text-primary/80">
                                                                {calendars.find(c => c.id === event.calendarId)?.summary}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-[9px] font-black opacity-30 uppercase">
                                                        Event
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Then Tasks */}
                                            {selectedDayTasks.map(task => (
                                                <div key={task.id} className="p-3 glass border border-white/5 rounded-2xl flex items-center justify-between group hover:bg-white/5 transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "w-1.5 h-1.5 rounded-full shadow-[0_0_8px_currentColor]",
                                                            task.priority === 'high' ? "text-red-400" :
                                                                task.priority === 'medium' ? "text-amber-400" : "text-blue-400"
                                                        )} />
                                                        <span className="text-xs font-bold text-white/80 group-hover:text-white transition-colors">
                                                            {task.title}
                                                        </span>
                                                    </div>
                                                    <div className="text-[9px] font-black opacity-30 uppercase">
                                                        {task.priority}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-white/5 text-[9px] font-bold uppercase tracking-[0.2em] text-center opacity-20">
                            Neural Sync Active v4.2
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
