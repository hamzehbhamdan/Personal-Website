"use client";

import { useState, useEffect } from "react";
import {
    X,
    Clock,
    Calendar as CalendarIcon,
    BarChart2,
    Plus,
    ChevronRight,
    CheckCircle2,
    Circle,
    Tag,
    Trash2,
    Shield,
    Terminal,
    Layout,
    Play,
    Pause,
    Square
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Task, Subtask, CustomField, Project, Sprint } from "@/lib/types";
import { Link } from "lucide-react";

function TimeTracker({
    taskId,
    initialTime,
    timerStartedAt,
    onTimeUpdate,
    onTimerStateChange
}: {
    taskId: string;
    initialTime: number;
    timerStartedAt: Date | null;
    onTimeUpdate: (t: number) => void;
    onTimerStateChange: (startedAt: Date | null) => void;
}) {
    const [displayTime, setDisplayTime] = useState(initialTime);

    // Calculate if timer is running based on timerStartedAt from database
    const isRunning = !!timerStartedAt;

    // Calculate elapsed time including saved time
    useEffect(() => {
        if (timerStartedAt) {
            // Calculate elapsed time since timer was started
            const elapsed = Math.floor((Date.now() - new Date(timerStartedAt).getTime()) / 60000);
            setDisplayTime(initialTime + elapsed);
        } else {
            setDisplayTime(initialTime);
        }
    }, [timerStartedAt, initialTime]);

    // Live update every second when running
    useEffect(() => {
        if (!isRunning || !timerStartedAt) return;

        const interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - new Date(timerStartedAt).getTime()) / 60000);
            setDisplayTime(initialTime + elapsed);
        }, 1000);

        return () => clearInterval(interval);
    }, [isRunning, timerStartedAt, initialTime]);

    const handleToggle = async () => {
        if (isRunning) {
            // Stopping timer - save elapsed time to time_spent
            const elapsed = Math.floor((Date.now() - new Date(timerStartedAt!).getTime()) / 60000);
            const newTotalTime = initialTime + elapsed;
            onTimeUpdate(newTotalTime);
            onTimerStateChange(null);
        } else {
            // Starting timer - save current timestamp
            onTimerStateChange(new Date());
        }
    };

    const formatTime = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m}m`;
    };

    // Calculate live seconds for animation
    const liveSeconds = timerStartedAt
        ? Math.floor((Date.now() - new Date(timerStartedAt).getTime()) / 1000) % 60
        : 0;

    return (
        <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl p-3 px-4 h-[50px]">
            <button
                onClick={handleToggle}
                className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                    isRunning ? "bg-red-500/20 text-red-500" : "bg-emerald-500/20 text-emerald-500"
                )}
            >
                {isRunning ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
            </button>
            <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                    {isRunning ? "Timer Active" : "Total Focus"}
                </span>
                <span className="text-sm font-bold font-mono">{formatTime(displayTime)}</span>
            </div>
            {isRunning && (
                <div className="ml-auto flex items-center gap-2">
                    <span className="text-[10px] font-mono text-emerald-400">:{String(liveSeconds).padStart(2, '0')}</span>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
            )}
        </div>
    );
}

interface TaskDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task;
    projects: Project[];
    sprints?: Sprint[];
    onSave: (task: Task) => void;
    allTasks?: Task[]; // For dependency selection
}

export function TaskDetailModal({ isOpen, onClose, task, projects, sprints = [], onSave, allTasks = [] }: TaskDetailModalProps) {
    const [editedTask, setEditedTask] = useState<Task>(task);
    const [newSubtask, setNewSubtask] = useState("");
    const [newFieldName, setNewFieldName] = useState("");
    const [newFieldValue, setNewFieldValue] = useState("");
    const [isAddingField, setIsAddingField] = useState(false);
    const [isAddingDependency, setIsAddingDependency] = useState(false);

    const handleAddDependency = (blockerId: string) => {
        if (!blockerId) return;
        const currentBlocks = editedTask.blockedBy || [];
        if (!currentBlocks.includes(blockerId)) {
            setEditedTask({
                ...editedTask,
                blockedBy: [...currentBlocks, blockerId]
            });
        }
        setIsAddingDependency(false);
    };

    const removeDependency = (blockerId: string) => {
        setEditedTask({
            ...editedTask,
            blockedBy: (editedTask.blockedBy || []).filter(id => id !== blockerId)
        });
    };

    const handleAddSubtask = () => {
        if (!newSubtask.trim()) return;
        const sub: Subtask = {
            id: Math.random().toString(36).substr(2, 9),
            title: newSubtask,
            completed: false
        };
        setEditedTask({
            ...editedTask,
            subtasks: [...editedTask.subtasks, sub]
        });
        setNewSubtask("");
    };

    const toggleSubtask = (id: string) => {
        setEditedTask({
            ...editedTask,
            subtasks: editedTask.subtasks.map(s =>
                s.id === id ? { ...s, completed: !s.completed } : s
            )
        });
    };

    const removeSubtask = (id: string) => {
        setEditedTask({
            ...editedTask,
            subtasks: editedTask.subtasks.filter(s => s.id !== id)
        });
    };

    const handleAddCustomField = () => {
        if (!newFieldName.trim() || !newFieldValue.trim()) return;
        const newField: CustomField = {
            id: Math.random().toString(36).substr(2, 9),
            label: newFieldName,
            value: newFieldValue
        };
        setEditedTask({
            ...editedTask,
            customFields: [...(editedTask.customFields || []), newField]
        });
        setNewFieldName("");
        setNewFieldValue("");
        setIsAddingField(false);
    };

    const removeCustomField = (id: string) => {
        setEditedTask({
            ...editedTask,
            customFields: editedTask.customFields?.filter(f => f.id !== id)
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start p-6 border-b border-white/10">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={editedTask.title}
                                    onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                                    className="bg-transparent text-2xl font-bold text-white outline-none w-full focus:bg-white/5 px-2 rounded-md transition-all"
                                />
                                <div className="flex items-center gap-4 mt-2 text-xs text-white/40 font-medium px-2 uppercase tracking-widest">
                                    <span className="flex items-center gap-1.5"><Tag size={12} /> {editedTask.status}</span>
                                    <span className="flex items-center gap-1.5"><BarChart2 size={12} /> {editedTask.priority}</span>
                                    {editedTask.projectId && (
                                        <div className="flex items-center gap-1.5 text-primary">
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: projects.find(p => p.id === editedTask.projectId)?.color || '#fff' }} />
                                            {projects.find(p => p.id === editedTask.projectId)?.name}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-2">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-10">

                            {/* Description */}
                            <section className="space-y-3">
                                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest flex items-center gap-2">
                                    Description
                                </h3>
                                <textarea
                                    value={editedTask.description}
                                    onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                                    className="w-full bg-white/5 border border-white/5 rounded-xl p-4 text-white/80 text-sm focus:outline-none focus:bg-white/10 min-h-[120px] transition-all"
                                    placeholder="Add details about this task..."
                                />
                            </section>

                            {/* Subtasks */}
                            <section className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest flex items-center gap-2">
                                        Subtasks
                                    </h3>
                                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white/60">
                                        {editedTask.subtasks.filter(s => s.completed).length} / {editedTask.subtasks.length}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {editedTask.subtasks?.map(sub => (
                                        <div key={sub.id} className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-xl group">
                                            <button
                                                onClick={() => toggleSubtask(sub.id)}
                                                className={cn("transition-colors", sub.completed ? "text-emerald-400" : "text-white/20")}
                                            >
                                                {sub.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                                            </button>
                                            <span className={cn("text-sm transition-all flex-1", sub.completed ? "text-white/30 line-through" : "text-white/80")}>
                                                {sub.title}
                                            </span>
                                            <button
                                                onClick={() => removeSubtask(sub.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-white/20 hover:text-red-400 transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    <div className="flex items-center gap-3 bg-white/5 rounded-lg p-2 pl-3">
                                        <Plus size={16} className="text-white/20" />
                                        <input
                                            type="text"
                                            value={newSubtask}
                                            onChange={(e) => setNewSubtask(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                                            placeholder="Add subtask..."
                                            className="bg-transparent text-sm text-white/80 outline-none flex-1"
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Custom Fields - Strategic Metadata */}
                            <section className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Terminal size={12} className="text-primary" /> Strategy Metadata
                                    </h3>
                                    <button
                                        onClick={() => setIsAddingField(true)}
                                        className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest"
                                    >
                                        + Dynamic Cluster
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {editedTask.customFields?.map((field, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl p-4 group">
                                            <div className="w-1/3 text-[10px] font-black text-white/30 uppercase tracking-widest truncate">{field.label}</div>
                                            <div className="flex-1 text-sm font-medium">{field.value}</div>
                                            <button
                                                onClick={() => removeCustomField(field.id)}
                                                className="opacity-0 group-hover:opacity-100 p-2 text-white/20 hover:text-red-400 transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}

                                    {isAddingField && (
                                        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col gap-3 p-4 bg-white/5 border border-primary/20 rounded-2xl">
                                            <div className="grid grid-cols-2 gap-3">
                                                <input
                                                    placeholder="Field Label (e.g. Branch)"
                                                    value={newFieldName}
                                                    onChange={e => setNewFieldName(e.target.value)}
                                                    className="bg-zinc-900 border border-white/5 rounded-xl px-4 py-2 text-xs outline-none focus:border-primary/40"
                                                />
                                                <input
                                                    placeholder="Field Value"
                                                    value={newFieldValue}
                                                    onChange={e => setNewFieldValue(e.target.value)}
                                                    className="bg-zinc-900 border border-white/5 rounded-xl px-4 py-2 text-xs outline-none focus:border-primary/40"
                                                />
                                            </div>
                                            <div className="flex justify-end gap-2 mt-2">
                                                <button onClick={() => setIsAddingField(false)} className="px-3 py-1 text-[10px] font-bold uppercase opacity-40">Cancel</button>
                                                <button onClick={handleAddCustomField} className="px-4 py-1.5 bg-primary text-black rounded-lg text-[10px] font-black uppercase">Inject Data</button>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </section>

                            {/* Urgency & Importance Matrix */}
                            <section className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-1">Urgency Level</h3>
                                    <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5">
                                        {(['low', 'medium', 'high'] as const).map(l => (
                                            <button
                                                key={l}
                                                onClick={() => setEditedTask({ ...editedTask, urgency: l })}
                                                className={cn(
                                                    "flex-1 py-2 text-[10px] uppercase font-bold tracking-widest rounded-xl transition-all",
                                                    editedTask.urgency === l ? (l === 'high' ? "bg-red-500 text-white" : "bg-white text-black") : "text-white/40 hover:text-white"
                                                )}
                                            >
                                                {l}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-1">Importance Level</h3>
                                    <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5">
                                        {(['low', 'medium', 'high'] as const).map(l => (
                                            <button
                                                key={l}
                                                onClick={() => setEditedTask({ ...editedTask, importance: l })}
                                                className={cn(
                                                    "flex-1 py-2 text-[10px] uppercase font-bold tracking-widest rounded-xl transition-all",
                                                    editedTask.importance === l ? "bg-emerald-500 text-white" : "text-white/40 hover:text-white"
                                                )}
                                            >
                                                {l}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-white/5">
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-1">Time Tracking</h3>
                                    <TimeTracker
                                        taskId={editedTask.id}
                                        initialTime={editedTask.timeSpent || 0}
                                        timerStartedAt={editedTask.timerStartedAt || null}
                                        onTimeUpdate={(t) => setEditedTask({ ...editedTask, timeSpent: t })}
                                        onTimerStateChange={(startedAt) => setEditedTask({ ...editedTask, timerStartedAt: startedAt })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-1">Project Cluster</h3>
                                    <select
                                        value={editedTask.projectId || ""}
                                        onChange={(e) => setEditedTask({ ...editedTask, projectId: e.target.value })}
                                        className="bg-white/5 border border-white/5 rounded-2xl p-3 text-xs w-full outline-none focus:border-primary/40 appearance-none text-white h-[50px]"
                                    >
                                        <option value="" className="bg-zinc-950">NO_PROJECT_LINK</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id} className="bg-zinc-950">{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-1">Active Sprint</h3>
                                    <select
                                        value={editedTask.sprintId || ""}
                                        onChange={(e) => setEditedTask({ ...editedTask, sprintId: e.target.value })}
                                        className="bg-white/5 border border-white/5 rounded-2xl p-3 text-xs w-full outline-none focus:border-primary/40 appearance-none text-white h-[50px]"
                                    >
                                        <option value="" className="bg-zinc-950">BACKLOG_ONLY</option>
                                        {sprints.map(s => (
                                            <option key={s.id} value={s.id} className="bg-zinc-950">{s.name} ({s.status})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Dependencies */}
                            <section className="space-y-4 pt-6 border-t border-white/5">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Link size={12} className="text-primary" /> Neural Links (Dependencies)
                                    </h3>
                                    <button
                                        onClick={() => setIsAddingDependency(true)}
                                        className="text-[10px] font-black text-white/40 hover:text-primary transition-colors uppercase tracking-widest"
                                    >
                                        + Link Blocker
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {(editedTask.blockedBy || []).map(blockerId => {
                                        const blocker = allTasks.find(t => t.id === blockerId);
                                        return (
                                            <div key={blockerId} className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-3 px-4 group">
                                                <div className="flex-1">
                                                    <span className="text-[10px] bg-red-500 text-black font-black px-1.5 py-0.5 rounded tracking-widest mr-2">BLOCKED BY</span>
                                                    <span className="text-xs font-bold text-red-100">{blocker?.title || "Unknown Task"}</span>
                                                </div>
                                                <button onClick={() => removeDependency(blockerId)} className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-white transition-all">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {isAddingDependency && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative bg-zinc-900 border border-white/10 rounded-xl p-2 z-[150]">
                                            <select
                                                autoFocus
                                                onChange={(e) => handleAddDependency(e.target.value)}
                                                className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-xs outline-none focus:border-primary/40 appearance-none text-white"
                                            >
                                                <option value="">Select a defined directive...</option>
                                                {allTasks
                                                    .filter(t => t.id !== editedTask.id && !(editedTask.blockedBy || []).includes(t.id))
                                                    .map(t => (
                                                        <option key={t.id} value={t.id} className="bg-zinc-900 truncate">
                                                            {t.title.substring(0, 40)}...
                                                        </option>
                                                    ))
                                                }
                                            </select>
                                        </motion.div>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                            <button onClick={onClose} className="px-6 py-2 rounded-full text-sm font-medium text-white/60 hover:text-white transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={() => onSave(editedTask)}
                                className="bg-white text-black px-8 py-2 rounded-full font-bold hover:bg-zinc-200 transition-all shadow-xl active:scale-95"
                            >
                                Update Task
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
