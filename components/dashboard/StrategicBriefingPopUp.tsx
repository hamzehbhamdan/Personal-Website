"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, RefreshCw, Cpu, Brain, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface StrategicBriefingPopUpProps {
    isOpen: boolean;
    onClose: () => void;
    briefing: string | null;
    isLoading: boolean;
    onRefresh: () => void;
}

export function StrategicBriefingPopUp({ isOpen, onClose, briefing, isLoading, onRefresh }: StrategicBriefingPopUpProps) {
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
                        className="relative w-full max-w-sm glass border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl pointer-events-auto flex flex-col min-h-[400px] mb-24 ml-24"
                    >
                        {/* Header Area */}
                        <div className="p-8 pb-4 flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/20 rounded-2xl text-primary animate-pulse">
                                    <Sparkles size={24} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] block opacity-40 mb-1">Neural Core v4.2</span>
                                    <h2 className="text-xl font-bold tracking-tight">Strategic Briefing</h2>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all opacity-40 hover:opacity-100">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content Body */}
                        <div className="flex-1 p-8 pt-4 overflow-y-auto custom-scrollbar">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-6 opacity-40">
                                    <RefreshCw size={48} className="animate-spin text-primary" />
                                    <div className="text-center space-y-1">
                                        <p className="text-sm font-bold uppercase tracking-widest">Grokking Context...</p>
                                        <p className="text-[10px] max-w-[200px]">Synthesizing market data, personal directives, and schedule nodes.</p>
                                    </div>
                                </div>
                            ) : briefing ? (
                                <div className="space-y-6">
                                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest opacity-60">
                                            <Brain size={12} /> Mental Model Sync
                                        </div>
                                        <p className="text-sm leading-relaxed text-white/80 font-medium">
                                            {briefing}
                                        </p>
                                    </div>


                                </div>
                            ) : (
                                <div className="text-center py-20 opacity-20 italic">
                                    <Cpu size={40} className="mx-auto mb-4 opacity-10" />
                                    <p className="text-sm">No briefing generated for this cycle.</p>
                                </div>
                            )}
                        </div>

                        {/* Control Bar */}
                        <div className="p-6 border-t border-white/5 bg-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-2 opacity-30">
                                <Zap size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Proactive Mode Active</span>
                            </div>
                            <button
                                onClick={onRefresh}
                                disabled={isLoading}
                                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all disabled:opacity-50 group"
                            >
                                <RefreshCw size={14} className={cn(isLoading && "animate-spin")} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Re-Synthesize</span>
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
