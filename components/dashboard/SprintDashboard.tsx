"use client";

import { useState } from "react";
import {
    Timer,
    Calendar,
    CheckCircle2,
    Clock,
    TrendingUp,
    Play,
    Plus,
    Target,
    BarChart2,
    ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Task, Sprint } from "@/lib/types";

interface SprintDashboardProps {
    sprints: Sprint[];
    tasks: Task[];
    activeSprint: Sprint | null;
    onSelectSprint: (sprint: Sprint) => void;
    onCreateSprint: () => void;
    onEditTask: (task: Task) => void;
}

export function SprintDashboard({
    sprints,
    tasks,
    activeSprint,
    onSelectSprint,
    onCreateSprint,
    onEditTask
}: SprintDashboardProps) {
    const sprintTasks = tasks.filter(t => t.sprintId === activeSprint?.id);
    const completedTasks = sprintTasks.filter(t => t.status === 'done');
    const completionRate = sprintTasks.length > 0
        ? Math.round((completedTasks.length / sprintTasks.length) * 100)
        : 0;

    const totalTimeSpent = sprintTasks.reduce((acc, t) => acc + (t.timeSpent || 0), 0);

    // Statistics for active sprint
    const stats = [
        { label: "Completion", value: `${completionRate}%`, icon: CheckCircle2, color: "text-emerald-400" },
        { label: "Tasks", value: `${completedTasks.length}/${sprintTasks.length}`, icon: Target, color: "text-primary" },
        { label: "Hours Logged", value: `${Math.floor(totalTimeSpent / 60)}h`, icon: Clock, color: "text-blue-400" },
        { label: "Velocity", value: "8.5", icon: TrendingUp, color: "text-orange-400" },
    ];

    return (
        <div className="flex flex-col gap-6 h-full overflow-y-auto pr-2 scrollbar-hide">
            {/* Header / Active Sprint Summary */}
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <stat.icon size={16} className={stat.color} />
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{stat.label}</span>
                            </div>
                            <div className="text-2xl font-black text-white">{stat.value}</div>
                        </motion.div>
                    ))}
                </div>

                {activeSprint && (
                    <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <div className="text-[10px] font-black uppercase tracking-widest text-white/40">Campaign Progress</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-primary">{completionRate}% COMPLETED</div>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${completionRate}%` }}
                                className="h-full bg-primary shadow-[0_0_12px_rgba(255,255,255,0.3)]"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content - Sprint Tasks */}
                <div className="lg:col-span-2 space-y-6">
                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Current Directives</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-white/40 font-bold uppercase">Filter: Active</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {sprintTasks.length === 0 ? (
                                <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10 italic text-white/20">
                                    No tasks assigned to this sprint cluster.
                                </div>
                            ) : (
                                sprintTasks.map((task) => (
                                    <div
                                        key={task.id}
                                        onClick={() => onEditTask(task)}
                                        className="group bg-zinc-900/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:bg-white/5 transition-all cursor-pointer"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center border",
                                                task.status === 'done' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-primary/10 border-primary/20 text-primary"
                                            )}>
                                                {task.status === 'done' ? <CheckCircle2 size={18} /> : <Play size={18} />}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white group-hover:text-primary transition-colors">{task.title}</div>
                                                <div className="flex items-center gap-3 mt-1 text-[10px] text-white/40 font-bold uppercase tracking-tighter">
                                                    <span className="flex items-center gap-1"><Clock size={10} /> {task.timeSpent || 0}m</span>
                                                    <span className="flex items-center gap-1"><Timer size={10} /> {task.priority}</span>
                                                    {task.dueDate && <span>DUE {format(task.dueDate, 'MMM d')}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <ArrowRight size={16} className="text-white/10 group-hover:text-white/40 transition-colors" />
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>

                {/* Sidebar - Sprint Management */}
                <div className="space-y-6">
                    <section className="bg-primary/5 border border-primary/10 rounded-3xl p-6">
                        <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4">Sprint Command</h3>
                        {activeSprint ? (
                            <div className="space-y-4">
                                <div>
                                    <div className="text-lg font-black text-white mb-1">{activeSprint.name}</div>
                                    <div className="text-[10px] text-white/60 font-medium">Ends in {differenceInDays(new Date(activeSprint.endDate), new Date())} days</div>
                                </div>
                                <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                                    <div className="text-[10px] font-black uppercase text-white/40 mb-1">Objective</div>
                                    <div className="text-xs text-white/80 leading-relaxed">{activeSprint.goal || "Establish dominance in current sector."}</div>
                                </div>
                                <button
                                    onClick={onCreateSprint}
                                    className="w-full py-3 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2"
                                >
                                    <Plus size={14} /> New Phase
                                </button>
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <p className="text-xs text-white/40 mb-4 italic">No active phase detected.</p>
                                <button
                                    onClick={onCreateSprint}
                                    className="w-full py-3 bg-primary text-black rounded-xl text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-xl flex items-center justify-center gap-2"
                                >
                                    <Plus size={14} /> Initiate Sprint
                                </button>
                            </div>
                        )}
                    </section>

                    <section className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6">
                        <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4">Phase History</h3>
                        <div className="space-y-3">
                            {sprints.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => onSelectSprint(s)}
                                    className={cn(
                                        "w-full p-4 rounded-2xl border text-left transition-all group",
                                        activeSprint?.id === s.id
                                            ? "bg-white/5 border-primary/40"
                                            : "bg-transparent border-white/5 hover:border-white/10"
                                    )}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="text-xs font-bold text-white group-hover:text-primary transition-colors">{s.name}</div>
                                        <div className={cn("text-[9px] px-1.5 py-0.5 rounded uppercase font-black",
                                            s.status === 'active' ? "bg-emerald-500/20 text-emerald-400" :
                                                s.status === 'completed' ? "bg-blue-500/20 text-blue-400" : "bg-white/10 text-white/40"
                                        )}>
                                            {s.status}
                                        </div>
                                    </div>
                                    <div className="text-[9px] text-white/30 font-bold uppercase">{format(new Date(s.startDate), 'MMM d')} - {format(new Date(s.endDate), 'MMM d')}</div>
                                </button>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
