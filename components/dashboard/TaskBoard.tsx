"use client";

// KEPT FOR REINTEGRATION — currently unmounted. Before mounting: port all
// createSupabaseBrowserClient() data access to requireUser()-gated /api
// routes (the browser client is session-blind under httpOnly cookies and
// its .from() now throws). See docs/legacy-reintegration.md (finding #41).
import { useState, useEffect } from "react";
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragEndEvent,
    useDroppable,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    Loader2,
    Calendar,
    Layers,
    LayoutGrid,
    Plus,
    GripVertical,
    Clock,
    CheckCircle2,
    Layout,
    List,
    Grid,
    Target,
    Timer,
    TrendingUp,
    Play,
    Lock,
    Sliders,
    CheckSquare,
    Sparkles,
    Filter,
    Search,
    RotateCcw,
    BarChart2,
    MoreHorizontal,
    Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { TaskDetailModal } from "./TaskDetailModal";
import { TaskStats } from "./TaskStats";
import { SprintDashboard } from "./SprintDashboard";
import { Task, TaskStatus, Subtask, Project, Sprint } from "@/lib/types";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { KanbanColumnSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { toast } from "sonner";

const initialTasks: Task[] = [
    {
        id: "1",
        title: "Set up Supabase Project",
        description: "Initialize tables and SQL functions.",
        status: "todo",
        priority: "high",
        dueDate: new Date(),
        tags: ["core"],
        subtasks: [
            { id: "1-1", title: "Create profiles table", completed: true },
            { id: "1-2", title: "Enable pgvector", completed: false },
        ]
    },
    {
        id: "2",
        title: "Design CRM Interface",
        description: "Make it look premium like Apple.",
        status: "in-progress",
        priority: "medium",
        dueDate: null,
        tags: ["ui"],
        subtasks: []
    },
];

export function TaskBoard() {
    const supabase = createSupabaseBrowserClient();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [view, setView] = useState<"kanban" | "list" | "matrix" | "sprint">("kanban");
    const [isCreating, setIsCreating] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [isCreatingProject, setIsCreatingProject] = useState(false);
    // Default urgency/importance for new tasks from matrix quadrant
    const [defaultQuadrant, setDefaultQuadrant] = useState<{ urgency: string; importance: string } | null>(null);

    // Sprint tracking state
    const [sprints, setSprints] = useState<any[]>([]);
    const [activeSprint, setActiveSprint] = useState<any | null>(null);
    const [isCreatingSprint, setIsCreatingSprint] = useState(false);

    // Advanced Features State
    const [searchQuery, setSearchQuery] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
    const [statsOpen, setStatsOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState<{
        priorities: string[];
        tags: string[];
        dateRange: "all" | "today" | "week" | "overdue";
    }>({
        priorities: [],
        tags: [],
        dateRange: "all"
    });

    // Fetch tasks, projects, and sprints on mount
    useEffect(() => {
        const fetchData = async () => {
            const [tasksRes, projectsRes, sprintsRes] = await Promise.all([
                supabase.from('tasks').select('*, subtasks(*)').order('created_at', { ascending: false }),
                supabase.from('projects').select('*'),
                supabase.from('sprints').select('*').order('created_at', { ascending: false })
            ]);

            if (tasksRes.error) {
                console.error("Error fetching tasks:", tasksRes.error);
                setTasks(initialTasks);
            } else if (tasksRes.data) {
                setTasks(tasksRes.data.map(t => ({
                    ...t,
                    dueDate: t.due_date ? new Date(t.due_date) : null,
                    timerStartedAt: t.timer_started_at ? new Date(t.timer_started_at) : null,
                    projectId: t.project_id,
                    sprintId: t.sprint_id,
                    customFields: t.custom_fields || [],
                    tags: t.tags || [t.priority],
                    // Duplicates removed
                    subtasks: t.subtasks || [],
                    blockedBy: t.blocked_by || []
                })));
            } else {
                setTasks(initialTasks);
            }

            if (projectsRes.data && projectsRes.data.length > 0) {
                setProjects(projectsRes.data);
            } else {
                setProjects([
                    { id: "p1", name: "System Core", color: "#A35FFF" },
                    { id: "p2", name: "User Interface", color: "#5F9FFF" }
                ]);
            }

            if (sprintsRes.data) {
                const formattedSprints = sprintsRes.data.map(s => ({
                    ...s,
                    startDate: new Date(s.start_date),
                    endDate: new Date(s.end_date)
                }));
                setSprints(formattedSprints);

                // Set active sprint if one exists
                const active = formattedSprints.find(s => s.status === 'active');
                if (active) setActiveSprint(active);
            }

            setIsLoading(false);
        };

        fetchData();
        // Set up real-time subscription
        const tasksSubscription = supabase
            .channel('tasks-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
                fetchData();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(tasksSubscription);
        };
    }, []);

    // Listen for keyboard shortcut to create new task
    useEffect(() => {
        const handleCreateTask = () => setIsCreating(true);
        window.addEventListener('create-new-task', handleCreateTask);
        return () => window.removeEventListener('create-new-task', handleCreateTask);
    }, []);

    // Handle global subview switching (Cmd + Shift + Arrows)
    useEffect(() => {
        const handleSwitchView = (e: any) => {
            const direction = e.detail.direction;
            const views: Array<"kanban" | "list" | "matrix" | "sprint"> = ["kanban", "list", "matrix", "sprint"];
            const currentIndex = views.indexOf(view);
            let nextIndex = 0;

            if (direction === 'next') {
                nextIndex = (currentIndex + 1) % views.length;
            } else {
                nextIndex = (currentIndex - 1 + views.length) % views.length;
            }

            setView(views[nextIndex]);
        };

        window.addEventListener('switch-subview', handleSwitchView);
        return () => window.removeEventListener('switch-subview', handleSwitchView);
    }, [view]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const columns: { id: TaskStatus; title: string; color: string; bgColor: string }[] = [
        { id: "todo", title: "Queued", color: "#8b5cf6", bgColor: "bg-violet-500/10" },
        { id: "in-progress", title: "In Progress", color: "#3b82f6", bgColor: "bg-blue-500/10" },
        { id: "review", title: "In Review", color: "#f59e0b", bgColor: "bg-amber-500/10" },
        { id: "done", title: "Completed", color: "#22c55e", bgColor: "bg-emerald-500/10" },
    ];

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;

        const activeTask = tasks.find((t) => t.id === active.id);
        if (!activeTask) return;

        const isOverColumn = columns.some(col => col.id === over.id);
        if (isOverColumn) {
            const newStatus = over.id as TaskStatus;
            setTasks(tasks.map(t => t.id === active.id ? { ...t, status: newStatus } : t));
            supabase.from('tasks').update({ status: newStatus }).eq('id', active.id).then();
            return;
        }

        const overTask = tasks.find((t) => t.id === over.id);
        if (overTask && active.id !== over.id) {
            if (activeTask.status !== overTask.status) {
                setTasks(tasks.map(t => t.id === active.id ? { ...t, status: overTask.status } : t));
            } else {
                const activeIndex = tasks.findIndex((t) => t.id === active.id);
                const overIndex = tasks.findIndex((t) => t.id === over.id);
                setTasks((items) => arrayMove(items, activeIndex, overIndex));
            }
        }
    }

    // Matrix quadrant IDs map to urgency/importance combinations
    type UrgencyType = 'high' | 'medium' | 'low';
    type ImportanceType = 'high' | 'medium' | 'low';
    const quadrantSettings: Record<string, { urgency: UrgencyType; importance: ImportanceType }> = {
        'q1-do-first': { urgency: 'high', importance: 'high' },
        'q2-schedule': { urgency: 'medium', importance: 'high' },
        'q3-delegate': { urgency: 'high', importance: 'medium' },
        'q4-eliminate': { urgency: 'medium', importance: 'medium' },
    };

    function handleMatrixDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;

        const activeTask = tasks.find((t) => t.id === active.id);
        if (!activeTask) return;

        // Check if dropped on a quadrant
        const quadrantId = over.id as string;
        const quadrantConfig = quadrantSettings[quadrantId];

        if (quadrantConfig) {
            // Update task urgency/importance
            setTasks(tasks.map(t =>
                t.id === active.id
                    ? { ...t, urgency: quadrantConfig.urgency, importance: quadrantConfig.importance }
                    : t
            ));
            supabase.from('tasks').update({
                urgency: quadrantConfig.urgency,
                importance: quadrantConfig.importance
            }).eq('id', active.id).then(() => {
                toast.success(`Moved to ${quadrantId.replace('q', 'Q').replace(/-/g, ' ')}`);
            });
        }
    }

    // Helper to create task with preset quadrant values
    const handleQuadrantAdd = (quadrantId: string) => {
        const config = quadrantSettings[quadrantId];
        if (config) {
            setDefaultQuadrant(config);
        }
        setIsCreating(true);
    };

    const allTags = Array.from(new Set(tasks.flatMap(t => t.tags || [])));

    const filteredTasks = tasks.filter(t => {
        // Project Filter
        if (selectedProjectId && t.projectId !== selectedProjectId) return false;

        // Search Filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            if (!t.title.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
        }

        // Priority Filter
        if (activeFilters.priorities.length > 0 && !activeFilters.priorities.includes(t.priority)) return false;

        // Tag Filter
        if (activeFilters.tags.length > 0 && !t.tags.some(tag => activeFilters.tags.includes(tag))) return false;

        // Date Range
        if (activeFilters.dateRange !== 'all') {
            if (!t.dueDate) return false;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const due = new Date(t.dueDate);
            due.setHours(0, 0, 0, 0);

            if (activeFilters.dateRange === 'today' && due.getTime() !== today.getTime()) return false;
            if (activeFilters.dateRange === 'overdue' && due < today && t.status !== 'done') return false;
            if (activeFilters.dateRange === 'week') {
                const nextWeek = new Date(today);
                nextWeek.setDate(today.getDate() + 7);
                if (due < today || due > nextWeek) return false;
            }
        }

        return true;
    });

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedTaskIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedTaskIds(newSet);
    };

    const handleBulkAction = async (action: 'delete' | 'complete') => {
        if (action === 'delete') {
            if (!confirm(`Delete ${selectedTaskIds.size} tasks?`)) return;
            setTasks(prev => prev.filter(t => !selectedTaskIds.has(t.id)));
            selectedTaskIds.forEach(id => {
                supabase.from('tasks').delete().eq('id', id).then();
            });
            toast.success("Bulk delete complete");
        } else if (action === 'complete') {
            setTasks(prev => prev.map(t => selectedTaskIds.has(t.id) ? { ...t, status: 'done' } : t));
            selectedTaskIds.forEach(id => {
                supabase.from('tasks').update({ status: 'done' }).eq('id', id).then();
            });
            toast.success("Bulk complete successful");
        }
        setSelectedTaskIds(new Set());
    };

    const [isSorting, setIsSorting] = useState(false);

    const handleNeuralSort = async () => {
        setIsSorting(true);
        try {
            toast.info("Neural Engine analyzing directives...");
            const response = await fetch('/api/neural-sort', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tasks: filteredTasks })
            });

            if (!response.ok) throw new Error('Neural sort failed');

            const { scoredTasks } = await response.json();

            // Reorder tasks based on scores
            const scoreMap = new Map(scoredTasks.map((t: any) => [t.id, t.score]));

            // Sort the tasks array
            const sorted = [...tasks].sort((a, b) => {
                const scoreA = (scoreMap.get(a.id) as number) || 0;
                const scoreB = (scoreMap.get(b.id) as number) || 0;
                return scoreB - scoreA;
            });

            setTasks(sorted);
            toast.success("Directives optimized by priority");
        } catch (error) {
            console.error(error);
            toast.error("Neural Sort failed");
        } finally {
            setIsSorting(false);
        }
    };

    return (
        <div className="h-full w-full p-8 flex flex-col text-white max-w-7xl mx-auto">
            {/* Header / Control Node */}
            <div className="flex flex-col gap-6 mb-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold mb-1 tracking-tight flex items-center gap-3">
                            Directives Hub
                            <span className="text-[10px] bg-primary text-black px-2 py-0.5 rounded-full font-black uppercase tracking-widest">{filteredTasks.length}</span>
                        </h1>
                        <p className="text-white/40 text-sm italic">Manage your daily velocity and strategic alignment.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-1 flex gap-1 backdrop-blur-md">
                            <button onClick={() => setView("kanban")} className={cn("p-2 rounded-lg transition-all", view === "kanban" ? "bg-white/10 text-white shadow-lg" : "text-white/30 hover:text-white")}><Layers size={18} /></button>
                            <button onClick={() => setView("list")} className={cn("p-2 rounded-lg transition-all", view === "list" ? "bg-white/10 text-white shadow-lg" : "text-white/30 hover:text-white")}><List size={18} /></button>
                            <button onClick={() => setView("matrix")} className={cn("p-2 rounded-lg transition-all", view === "matrix" ? "bg-white/10 text-white shadow-lg" : "text-white/30 hover:text-white")}><Grid size={18} /></button>
                            <button onClick={() => setView("sprint")} className={cn("p-2 rounded-lg transition-all", view === "sprint" ? "bg-white/10 text-white shadow-lg" : "text-white/30 hover:text-white")}><Timer size={18} /></button>
                        </div>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="bg-white text-black pl-4 pr-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:scale-105 transition-all active:scale-95 shadow-xl shadow-white/10"
                        >
                            <Plus size={18} /> New directive
                        </button>
                    </div>
                </div>

                {/* Advanced Control Bar */}
                <div className="flex gap-4 items-center">
                    {/* Search Pill */}
                    <div className="flex-1 bg-white/5 border border-white/5 rounded-2xl flex items-center px-4 py-2.5 focus-within:bg-white/10 focus-within:border-white/10 transition-all">
                        <Search size={16} className="text-white/30 mr-3" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Query directives..."
                            className="bg-transparent outline-none text-sm text-white w-full placeholder:text-white/20 font-medium"
                        />
                    </div>

                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "px-4 py-2.5 rounded-2xl border flex items-center gap-2 text-sm font-bold transition-all",
                            showFilters || activeFilters.priorities.length > 0 ? "bg-primary text-black border-primary" : "bg-white/5 border-white/5 text-white/60 hover:text-white hover:bg-white/10"
                        )}
                    >
                        <Filter size={16} /> Filters
                    </button>

                    {/* Project Cluster Dropdown */}
                    <div className="relative group">
                        <select
                            value={selectedProjectId || ""}
                            onChange={(e) => setSelectedProjectId(e.target.value || null)}
                            className="appearance-none bg-white/5 border border-white/5 text-white/60 hover:text-white px-4 py-2.5 pr-8 rounded-2xl text-xs font-bold uppercase tracking-widest outline-none cursor-pointer transition-all hover:bg-white/10"
                        >
                            <option value="" className="bg-zinc-900">All Clusters</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id} className="bg-zinc-900">{p.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">▼</div>
                    </div>

                    {/* AI Button */}
                    <button
                        onClick={handleNeuralSort}
                        disabled={isSorting}
                        className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-purple-300 text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:brightness-125 transition-all disabled:opacity-50"
                    >
                        {isSorting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        {isSorting ? "Neural Optimization..." : "Neural Sort"}
                    </button>

                    {/* Stats Button */}
                    <button
                        onClick={() => setStatsOpen(true)}
                        className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/5 text-white/60 text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:bg-white/10 hover:text-white transition-all"
                    >
                        <BarChart2 size={14} /> Analysis
                    </button>
                </div>

                {/* Expanded Filter Panel */}
                <AnimatePresence>
                    {showFilters && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden"
                        >
                            <div className="p-6 grid grid-cols-3 gap-8">
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30">Priority Level</h4>
                                    <div className="flex gap-2 flex-wrap">
                                        {['high', 'medium', 'low'].map(p => (
                                            <button
                                                key={p}
                                                onClick={() => {
                                                    const prev = activeFilters.priorities;
                                                    setActiveFilters({
                                                        ...activeFilters,
                                                        priorities: prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
                                                    });
                                                }}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-xs font-bold capitalize border transition-all",
                                                    activeFilters.priorities.includes(p)
                                                        ? "bg-white text-black border-white"
                                                        : "bg-white/5 border-transparent text-white/40 hover:text-white hover:bg-white/10"
                                                )}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30">Temporal & Status</h4>
                                    <div className="flex gap-2 flex-wrap">
                                        {['all', 'today', 'week', 'overdue'].map(r => (
                                            <button
                                                key={r}
                                                onClick={() => setActiveFilters({ ...activeFilters, dateRange: r as any })}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-xs font-bold capitalize border transition-all",
                                                    activeFilters.dateRange === r
                                                        ? "bg-white text-black border-white"
                                                        : "bg-white/5 border-transparent text-white/40 hover:text-white hover:bg-white/10"
                                                )}
                                            >
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30">Tags</h4>
                                    <div className="flex gap-2 flex-wrap max-h-20 overflow-y-auto custom-scrollbar">
                                        {allTags.map(tag => (
                                            <button
                                                key={tag}
                                                onClick={() => {
                                                    const prev = activeFilters.tags;
                                                    setActiveFilters({
                                                        ...activeFilters,
                                                        tags: prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                                                    });
                                                }}
                                                className={cn(
                                                    "px-2 py-1 rounded text-[10px] font-bold uppercase transition-all",
                                                    activeFilters.tags.includes(tag)
                                                        ? "bg-primary text-black"
                                                        : "bg-white/5 text-white/30 hover:bg-white/10"
                                                )}
                                            >
                                                #{tag}
                                            </button>
                                        ))}
                                        {allTags.length === 0 && <span className="text-white/20 text-xs italic">No tags found</span>}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex-1 min-h-0">
                {view === "kanban" ? (
                    <div className="h-full flex gap-6 overflow-x-auto pb-6 scrollbar-hide">
                        {isLoading ? (
                            // Skeleton loading state
                            <>
                                <KanbanColumnSkeleton />
                                <KanbanColumnSkeleton />
                                <KanbanColumnSkeleton />
                                <KanbanColumnSkeleton />
                            </>
                        ) : filteredTasks.length === 0 ? (
                            // Empty state
                            <div className="flex-1 flex items-center justify-center">
                                <EmptyState
                                    icon={<Target size={28} />}
                                    title="No directives yet"
                                    description="Create your first task to start tracking your work and building momentum."
                                    actionLabel="New Directive"
                                    onAction={() => setIsCreating(true)}
                                />
                            </div>
                        ) : (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCorners}
                                onDragStart={(e) => setActiveId(e.active.id as string)}
                                onDragEnd={handleDragEnd}
                            >
                                {columns.map((col) => (
                                    <Column
                                        key={col.id}
                                        id={col.id}
                                        title={col.title}
                                        color={col.color}
                                        bgColor={col.bgColor}
                                        tasks={filteredTasks.filter((t) => t.status === col.id)}
                                        onTaskClick={setSelectedTask}
                                    />
                                ))}
                                <DragOverlay>
                                    {activeId ? <TaskCard task={tasks.find((t) => t.id === activeId)!} /> : null}
                                </DragOverlay>
                            </DndContext>
                        )}
                    </div>
                ) : view === "matrix" ? (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCorners}
                        onDragStart={(e) => setActiveId(e.active.id as string)}
                        onDragEnd={handleMatrixDragEnd}
                    >
                        <div className="h-full grid grid-cols-2 grid-rows-2 gap-4 pb-6">
                            {/* Q1: Do First (High Urgency, High Importance) */}
                            <MatrixQuadrant
                                id="q1-do-first"
                                title="Do First"
                                subtitle="Urgent & Important"
                                color="bg-red-500"
                                tasks={filteredTasks.filter(t => t.urgency === 'high' && t.importance === 'high')}
                                onTaskClick={setSelectedTask}
                                onAdd={() => handleQuadrantAdd('q1-do-first')}
                            />
                            {/* Q2: Schedule (Low Urgency, High Importance) */}
                            <MatrixQuadrant
                                id="q2-schedule"
                                title="Schedule"
                                subtitle="Less Urgent, Important"
                                color="bg-blue-500"
                                tasks={filteredTasks.filter(t => t.urgency !== 'high' && t.importance === 'high')}
                                onTaskClick={setSelectedTask}
                                onAdd={() => handleQuadrantAdd('q2-schedule')}
                            />
                            {/* Q3: Delegate (High Urgency, Low Importance) */}
                            <MatrixQuadrant
                                id="q3-delegate"
                                title="Delegate"
                                subtitle="Urgent, Less Important"
                                color="bg-amber-500"
                                tasks={filteredTasks.filter(t => t.urgency === 'high' && t.importance !== 'high')}
                                onTaskClick={setSelectedTask}
                                onAdd={() => handleQuadrantAdd('q3-delegate')}
                            />
                            {/* Q4: Delete (Low Urgency, Low Importance) */}
                            <MatrixQuadrant
                                id="q4-eliminate"
                                title="Eliminate"
                                subtitle="Not Urgent & Not Important"
                                color="bg-zinc-500"
                                tasks={filteredTasks.filter(t => t.urgency !== 'high' && t.importance !== 'high')}
                                onTaskClick={setSelectedTask}
                                onAdd={() => handleQuadrantAdd('q4-eliminate')}
                            />
                        </div>
                        <DragOverlay>
                            {activeId ? <TaskCard task={tasks.find((t) => t.id === activeId)!} /> : null}
                        </DragOverlay>
                    </DndContext>
                ) : view === "sprint" ? (
                    <SprintDashboard
                        sprints={sprints}
                        tasks={filteredTasks}
                        activeSprint={activeSprint}
                        onSelectSprint={setActiveSprint}
                        onCreateSprint={() => setIsCreatingSprint(true)}
                        onEditTask={setSelectedTask}
                    />
                ) : (
                    <div className="bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden flex flex-col h-full">
                        <div className="p-4 border-b border-white/5 grid grid-cols-12 text-[10px] font-black uppercase tracking-widest text-white/20 px-8">
                            <div className="col-span-6">Directive</div>
                            <div className="col-span-2">Status</div>
                            <div className="col-span-2">Priority</div>
                            <div className="col-span-2 text-right">Focus</div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                            {filteredTasks.map(task => (
                                <div
                                    key={task.id}
                                    className={cn(
                                        "p-6 glass rounded-2xl cursor-pointer transition-all grid grid-cols-12 items-center group px-8 border",
                                        selectedTaskIds.has(task.id) ? "border-primary/50 bg-primary/5" : "border-transparent hover:bg-white/5 hover:border-white/5"
                                    )}
                                    onClick={() => setSelectedTask(task)}
                                >
                                    <div className="col-span-6 flex items-center gap-4">
                                        <div
                                            onClick={(e) => { e.stopPropagation(); toggleSelection(task.id); }}
                                            className={cn(
                                                "w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer hover:scale-105",
                                                selectedTaskIds.has(task.id) ? "bg-primary border-primary text-black" : "border-white/20 hover:border-white/50"
                                            )}
                                        >
                                            {selectedTaskIds.has(task.id) && <CheckSquare size={12} />}
                                        </div>
                                        <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: projects.find(p => p.id === task.projectId)?.color || '#333' }} />
                                        <div>
                                            <p className={cn("font-bold text-sm transition-colors", selectedTaskIds.has(task.id) ? "text-primary" : "text-white group-hover:text-primary")}>{task.title}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] opacity-30 italic">{projects.find(p => p.id === task.projectId)?.name || "Uncategorized"}</span>
                                                {task.blockedBy && task.blockedBy.length > 0 && <span className="flex items-center gap-1 text-[10px] text-red-400 font-bold"><Lock size={8} /> BLOCKED</span>}
                                                {task.subtasks.length > 0 && (
                                                    <div className="flex gap-1">
                                                        {task.subtasks.slice(0, 3).map(s => (
                                                            <div key={s.id} className={cn("w-1 h-1 rounded-full", s.completed ? "bg-emerald-500" : "bg-white/10")} />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest bg-white/5 px-2 py-1 rounded text-white/40">{task.status.replace('-', ' ')}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="flex gap-2">
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded",
                                                task.urgency === 'high' ? 'bg-red-500/20 text-red-300' : 'bg-white/5 text-white/30'
                                            )}>
                                                U
                                            </span>
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded",
                                                task.importance === 'high' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-white/30'
                                            )}>
                                                I
                                            </span>
                                        </div>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <span className="text-xs font-bold font-mono">
                                            {task.timeSpent ? `${Math.floor(task.timeSpent / 60)}h ${task.timeSpent % 60}m` : "--"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Bulk Action Bar */}
            <AnimatePresence>
                {selectedTaskIds.size > 0 && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[60] bg-zinc-900 border border-white/20 rounded-2xl shadow-2xl px-6 py-3 flex items-center gap-6"
                    >
                        <div className="flex items-center gap-3 pr-6 border-r border-white/10">
                            <div className="bg-primary text-black font-black text-xs w-6 h-6 rounded flex items-center justify-center">
                                {selectedTaskIds.size}
                            </div>
                            <span className="text-xs font-bold text-white uppercase tracking-wider">Selected</span>
                            <button onClick={() => setSelectedTaskIds(new Set())} className="text-[10px] opacity-40 hover:opacity-100 uppercase font-black hover:text-red-400 ml-2">Clear</button>
                        </div>
                        <button onClick={() => handleBulkAction('complete')} className="flex items-center gap-2 text-xs font-bold text-emerald-400 hover:scale-105 transition-all">
                            <CheckCircle2 size={16} /> Mark Complete
                        </button>
                        <button onClick={() => handleBulkAction('delete')} className="flex items-center gap-2 text-xs font-bold text-red-400 hover:scale-105 transition-all">
                            <Trash2 size={16} /> Delete
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {(selectedTask || isCreating) && (
                <TaskDetailModal
                    isOpen={!!selectedTask || isCreating}
                    projects={projects}
                    sprints={sprints}
                    allTasks={tasks} // Pass all tasks for dependency selection
                    onClose={() => {
                        setSelectedTask(null);
                        setIsCreating(false);
                        setDefaultQuadrant(null);
                    }}
                    task={selectedTask || {
                        id: "",
                        title: "",
                        description: "",
                        status: "todo",
                        priority: "medium",
                        urgency: (defaultQuadrant?.urgency || "medium") as "high" | "medium" | "low",
                        importance: (defaultQuadrant?.importance || "medium") as "high" | "medium" | "low",
                        dueDate: null,
                        subtasks: [],
                        customFields: [],
                        tags: []
                    }}
                    onSave={async (updated: Task) => {
                        const userId = (await supabase.auth.getUser()).data.user?.id || '00000000-0000-0000-0000-000000000000';

                        // Optimistic Update
                        if (isCreating) {
                            const newTask = { ...updated, id: Math.random().toString(), time_spent: 0 };
                            setTasks([newTask, ...tasks]);

                            const { data, error } = await supabase
                                .from('tasks')
                                .insert({
                                    title: updated.title,
                                    description: updated.description,
                                    status: updated.status,
                                    priority: updated.priority,
                                    urgency: updated.urgency || "medium",
                                    importance: updated.importance || "medium",
                                    time_spent: updated.timeSpent || 0,
                                    due_date: updated.dueDate?.toISOString(),
                                    project_id: updated.projectId,
                                    sprint_id: updated.sprintId,
                                    user_id: userId,
                                    custom_fields: updated.customFields || [],
                                    tags: updated.tags || [],
                                    blocked_by: updated.blockedBy || []
                                })
                                .select();

                            if (!error && data && data[0]) {
                                const insertedTask = {
                                    ...data[0],
                                    dueDate: data[0].due_date ? new Date(data[0].due_date) : null,
                                    timerStartedAt: data[0].timer_started_at ? new Date(data[0].timer_started_at) : null,
                                    projectId: data[0].project_id,
                                    sprintId: data[0].sprint_id,
                                    customFields: data[0].custom_fields || [],
                                    tags: data[0].tags || [],
                                    subtasks: updated.subtasks || [],
                                    blockedBy: data[0].blocked_by || []
                                };
                                setTasks(prev => prev.map(t => t.id === newTask.id ? insertedTask : t));
                                toast.success("Task created", { description: updated.title });
                            }
                        } else {
                            setTasks(tasks.map(t => t.id === updated.id ? updated : t));
                            await supabase
                                .from('tasks')
                                .update({
                                    title: updated.title,
                                    description: updated.description,
                                    status: updated.status,
                                    priority: updated.priority,
                                    urgency: updated.urgency || "medium",
                                    importance: updated.importance || "medium",
                                    time_spent: updated.timeSpent || 0,
                                    timer_started_at: updated.timerStartedAt?.toISOString(),
                                    due_date: updated.dueDate?.toISOString(),
                                    project_id: updated.projectId,
                                    sprint_id: updated.sprintId,
                                    // Duplicates removed
                                    custom_fields: updated.customFields || [],
                                    tags: updated.tags || [],
                                    blocked_by: updated.blockedBy || []
                                })
                                .eq('id', updated.id);
                            toast.success("Task updated", { description: updated.title });
                        }
                        setSelectedTask(null);
                        setIsCreating(false);
                    }}
                />
            )}

            <TaskStats
                isOpen={statsOpen}
                onClose={() => setStatsOpen(false)}
                tasks={filteredTasks}
                projects={projects}
            />

            <CreateProjectModal
                isOpen={isCreatingProject}
                onClose={() => setIsCreatingProject(false)}
                onSave={async (name, color) => {
                    const userId = (await supabase.auth.getUser()).data.user?.id || '00000000-0000-0000-0000-000000000000';
                    const { data, error } = await supabase
                        .from('projects')
                        .insert({
                            name,
                            color,
                            user_id: userId
                        })
                        .select()
                        .single();

                    if (data) {
                        setProjects([...projects, data]);
                        setSelectedProjectId(data.id);
                    }
                }}
            />

            <CreateSprintModal
                isOpen={isCreatingSprint}
                onClose={() => setIsCreatingSprint(false)}
                onSave={async (sprintData) => {
                    const userId = (await supabase.auth.getUser()).data.user?.id || '00000000-0000-0000-0000-000000000000';
                    const { data, error } = await supabase
                        .from('sprints')
                        .insert({
                            name: sprintData.name,
                            goal: sprintData.goal,
                            start_date: sprintData.startDate.toISOString(),
                            end_date: sprintData.endDate.toISOString(),
                            status: 'active', // Default to active for new sprints for now
                            user_id: userId
                        })
                        .select()
                        .single();

                    if (data) {
                        const newSprint = {
                            ...data,
                            startDate: new Date(data.start_date),
                            endDate: new Date(data.end_date)
                        };
                        setSprints([newSprint, ...sprints]);
                        setActiveSprint(newSprint);
                        toast.success("New Phase Initiated", { description: sprintData.name });
                    }
                }}
            />
        </div>
    );
}

function CreateSprintModal({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (data: any) => void }) {
    const [name, setName] = useState("");
    const [goal, setGoal] = useState("");
    const [duration, setDuration] = useState(7); // default 7 days

    const handleSubmit = () => {
        if (!name.trim()) return;
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + duration);

        onSave({ name, goal, startDate, endDate });
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl">
                        <h2 className="text-xl font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Timer className="text-primary" /> Initiate Phase
                        </h2>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Phase Designation</label>
                                <input
                                    autoFocus
                                    placeholder="e.g. ALPHA_STRIKE"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white outline-none focus:border-primary/40 transition-all font-mono"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Strategic Objective</label>
                                <textarea
                                    placeholder="Define primary goal..."
                                    value={goal}
                                    onChange={e => setGoal(e.target.value)}
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white outline-none focus:border-primary/40 transition-all text-sm min-h-[100px]"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-white/40 ml-1">Temporal Span (Days)</label>
                                <div className="flex gap-2">
                                    {[7, 14, 30].map(d => (
                                        <button
                                            key={d}
                                            onClick={() => setDuration(d)}
                                            className={cn(
                                                "flex-1 py-3 rounded-xl border text-[10px] font-black tracking-widest transition-all",
                                                duration === d ? "bg-white text-black border-white" : "bg-white/5 border-white/5 text-white/40"
                                            )}
                                        >
                                            {d}D
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-10">
                            <button onClick={onClose} className="flex-1 py-4 text-white/60 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors">Abort</button>
                            <button onClick={handleSubmit} className="flex-[2] py-4 bg-primary text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-xl">Confirm Initiation</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function Column({ id, title, color, bgColor, tasks, onTaskClick }: { id: string; title: string; color: string; bgColor: string; tasks: Task[]; onTaskClick: (t: Task) => void }) {
    const { setNodeRef } = useSortable({ id });

    return (
        <div className="flex flex-col w-[320px] min-w-[320px]">
            {/* Column Header */}
            <div className={cn(
                "flex items-center justify-between mb-4 px-4 py-3 rounded-2xl border border-white/5",
                bgColor
            )}>
                <div className="flex items-center gap-3">
                    <div
                        className="w-3 h-3 rounded-full shadow-lg"
                        style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}40` }}
                    />
                    <h3 className="font-bold text-sm tracking-tight text-white/90">{title}</h3>
                </div>
                <span
                    className="text-[11px] font-black px-2.5 py-1 rounded-lg"
                    style={{ backgroundColor: `${color}20`, color: color }}
                >
                    {tasks.length}
                </span>
            </div>

            {/* Tasks Container */}
            <div
                ref={setNodeRef}
                className={cn(
                    "flex-1 flex flex-col gap-3 min-h-[200px] p-3 rounded-2xl border border-dashed border-white/5 transition-colors",
                    "hover:border-white/10 hover:bg-white/[0.02]"
                )}
            >
                <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center">
                            <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Drop here</p>
                        </div>
                    ) : (
                        tasks.map((task) => (
                            <SortableTaskItem key={task.id} task={task} columnColor={color} onClick={() => onTaskClick(task)} />
                        ))
                    )}
                </SortableContext>
            </div>
        </div>
    );
}

function SortableTaskItem({ task, columnColor, onClick }: { task: Task; columnColor: string; onClick: () => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={cn("cursor-grab active:cursor-grabbing", isDragging && "opacity-30 scale-105")} onClick={onClick}>
            <TaskCard task={task} accentColor={columnColor} />
        </div>
    );
}

function MatrixQuadrant({ id, title, subtitle, color, tasks, onTaskClick, onAdd }: {
    id: string;
    title: string;
    subtitle: string;
    color: string;
    tasks: Task[];
    onTaskClick: (t: Task) => void;
    onAdd?: () => void;
}) {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 p-4 flex flex-col h-full overflow-hidden transition-all",
                isOver && "ring-2 ring-primary/50 bg-primary/5"
            )}
        >
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="font-bold text-lg leading-none">{title}</h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mt-1">{subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                    {onAdd && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onAdd(); }}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
                        >
                            <Plus size={14} />
                        </button>
                    )}
                    <div className={cn("w-2 h-2 rounded-full", color.replace('bg-', 'bg-').replace('500', '400'))} />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map(task => (
                        <DraggableMatrixTask key={task.id} task={task} onTaskClick={onTaskClick} />
                    ))}
                </SortableContext>
                {tasks.length === 0 && (
                    <div className="flex-1 flex items-center justify-center py-8">
                        <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Drop tasks here</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function DraggableMatrixTask({ task, onTaskClick }: { task: Task; onTaskClick: (t: Task) => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => onTaskClick(task)}
            className={cn(
                "bg-white/5 hover:bg-white/10 p-3 rounded-xl border border-white/5 cursor-grab active:cursor-grabbing transition-all group",
                isDragging && "opacity-30 scale-105"
            )}
        >
            <div className="flex justify-between items-start mb-1">
                <span className="text-sm font-semibold text-white/90 line-clamp-1">{task.title}</span>
                {task.dueDate && (
                    <span className={cn("text-[9px] font-bold uppercase tracking-widest", task.dueDate < new Date() ? "text-red-400" : "text-white/30")}>
                        {format(task.dueDate, "MMM d")}
                    </span>
                )}
            </div>
            <div className="flex items-center gap-2">
                <span className={cn("text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/5 text-white/40")}>
                    {task.status}
                </span>
                {task.timeSpent && task.timeSpent > 0 && (
                    <span className="text-[9px] font-mono opacity-40 ml-auto">
                        {Math.floor(task.timeSpent / 60)}h {task.timeSpent % 60}m
                    </span>
                )}
            </div>
        </div>
    );
}


function CreateProjectModal({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave: (name: string, color: string) => void }) {
    const [name, setName] = useState("");
    const [color, setColor] = useState("#ffffff");

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-white/10 p-6 rounded-2xl w-full max-w-sm space-y-4">
                <h3 className="text-lg font-bold text-white">New Project Cluster</h3>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Name</label>
                    <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-primary/50"
                        placeholder="Project Name"
                        autoFocus
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Color Signature</label>
                    <div className="flex gap-2 flex-wrap">
                        {['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ec4899', '#ffffff'].map(c => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className={cn(
                                    "w-6 h-6 rounded-full border-2 transition-all",
                                    color === c ? "border-white scale-110" : "border-transparent hover:scale-105"
                                )}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-white/60 hover:text-white">CANCEL</button>
                    <button
                        onClick={() => {
                            if (name.trim()) {
                                onSave(name, color);
                                setName("");
                                onClose();
                            }
                        }}
                        className="bg-white text-black px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all"
                    >
                        Initialize
                    </button>
                </div>
            </div>
        </div>
    );
}

function TaskCard({ task, accentColor }: { task: Task; accentColor?: string }) {
    const completedSubtasks = task.subtasks.filter(s => s.completed).length;
    const progress = task.subtasks.length > 0 ? (completedSubtasks / task.subtasks.length) * 100 : 0;
    const isBlocked = task.blockedBy && task.blockedBy.length > 0;

    return (
        <div
            className={cn(
                "relative p-4 rounded-xl shadow-2xl backdrop-blur-md group transition-all hover:scale-[1.02] bg-black/40 border-y border-r border-white/10 overflow-hidden",
                isBlocked ? "border-red-500/30" : "border-white/10"
            )}
            style={{
                borderLeftWidth: '3px',
                borderLeftColor: isBlocked ? '#ef4444' : (accentColor || '#ffffff20')
            }}
        >
            {/* Subtle glow effect */}
            {accentColor && (
                <div
                    className="absolute inset-0 opacity-5 pointer-events-none"
                    style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
                />
            )}

            <div className="relative">
                <div className="flex justify-between items-start mb-2 gap-3">
                    <div className="text-sm font-semibold leading-tight text-white/90 flex items-start gap-2">
                        {isBlocked && <Lock size={12} className="text-red-400 mt-0.5 shrink-0" />} {task.title}
                    </div>
                    <GripVertical size={14} className="text-white/10 group-hover:text-white/30 shrink-0" />
                </div>

                {task.description && (
                    <p className="text-[11px] text-white/40 line-clamp-2 mb-3 leading-relaxed">{task.description}</p>
                )}

                {task.subtasks.length > 0 && (
                    <div className="mb-3">
                        <div className="flex justify-between text-[9px] uppercase tracking-widest font-bold text-white/30 mb-1">
                            <span>Progress</span>
                            <span>{completedSubtasks}/{task.subtasks.length}</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className="h-full"
                                style={{ backgroundColor: accentColor || '#ffffff66' }}
                            />
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                    <div className={cn(
                        "text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded border border-white/5",
                        task.priority === "high" && "bg-red-400/10 text-red-300",
                        task.priority === "medium" && "bg-yellow-400/10 text-yellow-300",
                        task.priority === "low" && "bg-blue-400/10 text-blue-300",
                    )}>
                        {task.priority}
                    </div>
                    {task.dueDate && <div className="text-[9px] text-white/30 flex items-center gap-1 uppercase font-bold tracking-widest"><Clock size={10} /> {format(task.dueDate, "MMM d")}</div>}
                </div>
            </div>
        </div>
    );
}
