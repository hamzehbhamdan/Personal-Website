"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, Circle, Plus, Trash2, Target, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Task, Sprint } from "@/lib/types";
import { TaskDetailModal } from "./TaskDetailModal";
import { toast } from "sonner";

interface QuickTasksPopUpProps {
    isOpen: boolean;
    onClose: () => void;
}

export function QuickTasksPopUp({ isOpen, onClose }: QuickTasksPopUpProps) {
    const supabase = createSupabaseBrowserClient();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [sprints, setSprints] = useState<Sprint[]>([]);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [tasksRes, sprintsRes] = await Promise.all([
            supabase
                .from('tasks')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10),
            supabase
                .from('sprints')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
        ]);

        if (tasksRes.data) setTasks(tasksRes.data);
        if (sprintsRes.data) {
            setSprints(sprintsRes.data.map((s: any) => ({
                ...s,
                startDate: new Date(s.start_date),
                endDate: new Date(s.end_date)
            })));
        }
    }, []);

    useEffect(() => {
        if (isOpen) fetchData();
    }, [isOpen, fetchData]);

    const handleAddTask = async () => {
        if (!newTaskTitle.trim()) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error("User not authenticated. Please log in.");
            return;
        }

        const newTask: Task = {
            id: 'temp-' + Date.now(),
            user_id: user.id,
            title: newTaskTitle,
            description: "",
            status: 'todo',
            priority: 'medium',
            created_at: new Date().toISOString(),
            urgency: 'medium',
            importance: 'medium',
            dueDate: null,
            subtasks: [],
            tags: [],
            timeSpent: 0
        };

        // Optimistic update
        setTasks(prev => [newTask, ...prev]);
        setNewTaskTitle("");

        const { data, error } = await supabase.from('tasks').insert({
            title: newTaskTitle,
            status: 'todo',
            user_id: user.id
        }).select().single();

        if (error) {
            console.error("Error adding task:", error);
            toast.error("Failed to add directive");
            // Revert optimistic update
            setTasks(prev => prev.filter(t => t.id !== newTask.id));
            setNewTaskTitle(newTaskTitle); // Restore input
        } else {
            toast.success("Directive added to hub");
            // Replace temp task with real one
            if (data) {
                setTasks(prev => prev.map(t => t.id === newTask.id ? data : t));
            }
            // Force fetch to ensure sync
            setTimeout(fetchData, 500);
        }
    };

    const toggleTask = async (task: Task) => {
        const newStatus = task.status === 'done' ? 'todo' : 'done';
        const { error } = await supabase
            .from('tasks')
            .update({ status: newStatus })
            .eq('id', task.id);

        if (!error) fetchData();
    };

    const deleteTask = async (id: string) => {
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (!error) fetchData();
    };

    const handleSaveTask = async (task: Task) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        if (task.id) {
            // Update existing task
            await supabase.from('tasks').update({
                title: task.title,
                description: task.description,
                status: task.status,
                priority: task.priority,
                due_date: task.dueDate?.toISOString() || null,
                urgency: task.urgency,
                importance: task.importance,
                sprint_id: task.sprintId,
                project_id: task.projectId,
                tags: task.tags || [],
                custom_fields: task.customFields || [],
            }).eq('id', task.id);
        } else {
            // Create new task
            await supabase.from('tasks').insert({
                title: task.title,
                description: task.description,
                status: task.status || 'todo',
                priority: task.priority || 'medium',
                due_date: task.dueDate?.toISOString() || null,
                urgency: task.urgency,
                importance: task.importance,
                user_id: user.id,
                sprint_id: task.sprintId,
                project_id: task.projectId,
            });
        }

        setSelectedTask(null);
        setIsTaskModalOpen(false);
        fetchData();
    };

    return (
        <>
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
                            <div className="p-6 flex justify-between items-center bg-white/5 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/20 rounded-xl text-primary">
                                        <Target size={18} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Directives Hub</span>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all opacity-40 hover:opacity-100">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Input Area */}
                            <div className="p-6 border-b border-white/5">
                                <div className="relative group">
                                    <input
                                        type="text"
                                        value={newTaskTitle}
                                        onChange={(e) => setNewTaskTitle(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleAddTask();
                                            }
                                        }}
                                        placeholder="Add new directive..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary transition-all text-sm placeholder:text-white/20"
                                    />
                                    <button
                                        onClick={handleAddTask}
                                        disabled={!newTaskTitle.trim()}
                                        className="absolute right-2 top-1.5 p-1.5 bg-primary text-black rounded-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Add Task"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* List Area */}
                            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-3">
                                {tasks.length === 0 ? (
                                    <div className="text-center py-10 opacity-20 italic">
                                        <CheckCircle2 size={32} className="mx-auto mb-4 opacity-10" />
                                        <p className="text-sm">No active directives.</p>
                                    </div>
                                ) : (
                                    tasks.map((task) => (
                                        <div key={task.id} className="group flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleTask(task); }}
                                                className={cn(
                                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                                                    task.status === 'done' ? "bg-primary border-primary text-black" : "border-white/20 hover:border-white/40"
                                                )}
                                            >
                                                {task.status === 'done' && <CheckCircle2 size={12} fill="currentColor" />}
                                            </button>
                                            <button
                                                onClick={() => { setSelectedTask(task); setIsTaskModalOpen(true); }}
                                                className={cn(
                                                    "flex-1 text-sm font-medium transition-all text-left hover:text-primary cursor-pointer",
                                                    task.status === 'done' ? "line-through opacity-30" : "opacity-80"
                                                )}
                                            >
                                                {task.title}
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedTask(task); setIsTaskModalOpen(true); }}
                                                className="opacity-0 group-hover:opacity-40 hover:!opacity-100 hover:text-primary p-1 transition-all"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                                                className="opacity-0 group-hover:opacity-40 hover:!opacity-100 hover:text-red-400 p-1 transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4 bg-black/20 text-center">
                                <p className="text-[10px] font-bold opacity-20 uppercase tracking-[0.2em]">Press Enter to rapid fire create</p>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Task Detail Modal */}
            {selectedTask && (
                <TaskDetailModal
                    isOpen={isTaskModalOpen}
                    onClose={() => { setSelectedTask(null); setIsTaskModalOpen(false); }}
                    task={selectedTask}
                    onSave={handleSaveTask}
                    projects={[]}
                    sprints={sprints}
                />
            )}
        </>
    );
}
