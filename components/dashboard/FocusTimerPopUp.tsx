"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, X, Target, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

interface FocusTimerPopUpProps {
    isOpen: boolean;
    onClose: () => void;
    onSessionComplete?: (durationSeconds: number) => void;
}

export function FocusTimerPopUp({ isOpen, onClose, onSessionComplete }: FocusTimerPopUpProps) {
    const supabase = createSupabaseBrowserClient();
    const [seconds, setSeconds] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [history, setHistory] = useState<{ duration: number; created_at: string }[]>([]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRunning) {
            interval = setInterval(() => {
                setSeconds((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning]);

    const fetchHistory = useCallback(async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data } = await supabase
            .from('focus_sessions')
            .select('duration, created_at')
            .gte('created_at', today.toISOString())
            .order('created_at', { ascending: false });

        if (data) setHistory(data);
    }, []);

    useEffect(() => {
        if (isOpen) fetchHistory();
    }, [isOpen, fetchHistory]);

    const handleToggle = () => setIsRunning(!isRunning);

    const handleReset = async () => {
        if (seconds > 0) {
            // Save session before reset
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id || '00000000-0000-0000-0000-000000000000';

            await supabase.from('focus_sessions').insert({
                duration: seconds,
                user_id: userId
            });

            if (onSessionComplete) onSessionComplete(seconds);
            fetchHistory();
        }
        setSeconds(0);
        setIsRunning(false);
    };

    const formatTime = (totalSeconds: number) => {
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${hrs > 0 ? `${hrs}:` : ""}${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const totalFocusedToday = history.reduce((acc, curr) => acc + curr.duration, 0);

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
                            <div className="flex items-center gap-2">
                                <Target className="text-primary animate-pulse" size={20} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Focus Node</span>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all opacity-40 hover:opacity-100">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Timer Display */}
                        <div className="p-10 text-center">
                            <div className="text-7xl font-bold font-mono tracking-tighter mb-4 tabular-nums">
                                {formatTime(seconds)}
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-20 mb-10">Active Session</p>

                            {/* Controls */}
                            <div className="flex items-center justify-center gap-6">
                                <button
                                    onClick={handleReset}
                                    className="p-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all group lg:hover:scale-110 active:scale-95"
                                    title="Finish and Save"
                                >
                                    <RotateCcw size={20} className="group-hover:rotate-[-45deg] transition-transform" />
                                </button>
                                <button
                                    onClick={handleToggle}
                                    className={cn(
                                        "w-20 h-20 rounded-full flex items-center justify-center transition-all lg:hover:scale-110 active:scale-95 shadow-xl",
                                        isRunning ? "bg-white text-black" : "bg-primary text-black"
                                    )}
                                >
                                    {isRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                                </button>
                            </div>
                        </div>

                        {/* History / Stats */}
                        <div className="p-8 bg-black/20 border-t border-white/5">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2 opacity-40">
                                    <History size={14} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Today's Total</span>
                                </div>
                                <span className="text-sm font-bold text-primary">{Math.round(totalFocusedToday / 60)}m</span>
                            </div>

                            <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                                {history.length === 0 ? (
                                    <p className="text-[10px] opacity-20 italic text-center py-4">No sessions logged yet today.</p>
                                ) : (
                                    history.map((session, i) => (
                                        <div key={i} className="flex justify-between items-center text-[10px] py-2 border-b border-white/5 last:border-0 opacity-40">
                                            <span>{new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            <span className="font-bold">{formatTime(session.duration)}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
