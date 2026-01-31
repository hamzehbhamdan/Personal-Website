"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { Task, Project } from "@/lib/types";
import { CheckCircle2, Clock, Zap, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskStatsProps {
    tasks: Task[];
    projects: Project[];
    isOpen: boolean;
    onClose: () => void;
}

export function TaskStats({ tasks, projects, isOpen, onClose }: TaskStatsProps) {
    const stats = useMemo(() => {
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'done').length;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

        const timeSpentTotal = tasks.reduce((acc, t) => acc + (t.timeSpent || 0), 0);

        // High priority stats
        const highPriorityTotal = tasks.filter(t => t.priority === 'high').length;
        const highPriorityDone = tasks.filter(t => t.priority === 'high' && t.status === 'done').length;
        const highPriorityRate = highPriorityTotal > 0 ? Math.round((highPriorityDone / highPriorityTotal) * 100) : 0;

        // Project breakdown
        const projectStats = projects.map(p => {
            const pTasks = tasks.filter(t => t.projectId === p.id);
            return {
                name: p.name,
                color: p.color,
                count: pTasks.length,
                completed: pTasks.filter(t => t.status === 'done').length
            };
        }).sort((a, b) => b.count - a.count);

        return { total, completed, rate, timeSpentTotal, highPriorityRate, projectStats };
    }, [tasks, projects]);

    if (!isOpen) return null;

    return (
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
                className="relative w-full max-w-4xl bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            <Zap className="text-primary" /> System Analytics
                        </h2>
                        <p className="text-white/40 text-sm mt-1">Performance metrics and velocity tracking.</p>
                    </div>
                    <button onClick={onClose} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold uppercase transition-all">Close</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Main Completion Rate */}
                    <div className="bg-black/20 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                        <div className="w-32 h-32 mb-4">
                            <CircularProgressbar
                                value={stats.rate}
                                text={`${stats.rate}%`}
                                styles={buildStyles({
                                    pathColor: '#5FFF9F',
                                    textColor: '#fff',
                                    trailColor: 'rgba(255,255,255,0.1)',
                                    textSize: '20px'
                                })}
                            />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-white/40">Completion Rate</span>
                    </div>

                    {/* Stats Grid */}
                    <div className="md:col-span-2 grid grid-cols-2 gap-4">
                        <div className="bg-black/20 border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
                            <div className="flex items-center gap-3 text-white/40 mb-2">
                                <CheckCircle2 size={18} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Tasks Cleared</span>
                            </div>
                            <span className="text-4xl font-mono font-bold">{stats.completed}/{stats.total}</span>
                        </div>

                        <div className="bg-black/20 border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
                            <div className="flex items-center gap-3 text-white/40 mb-2">
                                <Clock size={18} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Focus Time</span>
                            </div>
                            <span className="text-4xl font-mono font-bold">
                                {Math.floor(stats.timeSpentTotal / 60)}<span className="text-sm opacity-40">h</span> {stats.timeSpentTotal % 60}<span className="text-sm opacity-40">m</span>
                            </span>
                        </div>

                        <div className="bg-black/20 border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
                            <div className="flex items-center gap-3 text-white/40 mb-2">
                                <Target size={18} />
                                <span className="text-[10px] font-black uppercase tracking-widest">High Priority Yield</span>
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-mono font-bold">{stats.highPriorityRate}%</span>
                                <div className="h-full w-full bg-white/5 rounded-full mb-2 h-1.5 overflow-hidden">
                                    <div className="h-full bg-red-400" style={{ width: `${stats.highPriorityRate}%` }} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-black/20 border border-white/5 rounded-2xl p-6 flex flex-col justify-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">System Status</span>
                            <span className={cn(
                                "text-lg font-bold uppercase tracking-widest",
                                stats.rate > 80 ? "text-emerald-400" : stats.rate > 50 ? "text-yellow-400" : "text-white"
                            )}>
                                {stats.rate > 80 ? "OPTIMAL" : stats.rate > 50 ? "NOMINAL" : "STAGNANT"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Project Breakdown */}
                <h3 className="text-sm font-bold uppercase tracking-widest text-white/60 mb-4 pl-1">Distribution by Cluster</h3>
                <div className="space-y-3">
                    {stats.projectStats.map(p => (
                        <div key={p.name} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                            <div className="w-32">
                                <span className="block text-sm font-bold truncate">{p.name}</span>
                            </div>
                            <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden flex">
                                <div className="h-full bg-white/20" style={{ width: '100%' }}>
                                    <div className="h-full bg-white/80 transition-all" style={{ width: `${p.count > 0 ? (p.completed / p.count) * 100 : 0}%`, backgroundColor: p.color }} />
                                </div>
                            </div>
                            <div className="w-20 text-right text-xs font-mono font-bold opacity-60">
                                {p.completed}/{p.count}
                            </div>
                        </div>
                    ))}
                    {stats.projectStats.length === 0 && (
                        <p className="text-center text-white/20 italic py-4">No data available</p>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
