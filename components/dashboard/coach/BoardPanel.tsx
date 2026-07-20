"use client";
import { useMemo, useState } from "react";
import {
  DndContext, DragOverlay, PointerSensor, KeyboardSensor, useSensor, useSensors,
  closestCorners, useDraggable, useDroppable, type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import type { CoachDB, Task, TaskStage } from "@/lib/dashboard/coach/types";
import { STAGES, applyStage } from "@/lib/dashboard/coach/board";
import { uid } from "@/lib/dashboard/coach/migrate";
import { BoardCard } from "./BoardCard";
import { focusRing } from "./a11y";
import type { Overlay } from "./overlay";

const mono = { fontFamily: "var(--font-geist-mono), monospace" };

function DraggableCard({ db, task, accent, onOpen }: {
  db: CoachDB; task: Task; accent: string; onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } =
    useDraggable({ id: task.id });
  return (
    <div ref={setNodeRef} className={`relative ${isDragging ? "opacity-30" : ""}`}>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Edit task: ${task.label}`}
        className={`block w-full cursor-pointer rounded-[10px] text-left ${focusRing}`}
      >
        <BoardCard db={db} task={task} accent={accent} />
      </button>
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Drag task: ${task.label}`}
        className={`absolute right-1 top-1.5 cursor-grab touch-none rounded-[6px] px-1 py-0.5 text-[12px] leading-none text-stone-300 hover:text-stone-500 active:cursor-grabbing ${focusRing}`}
      >
        ⠿
      </button>
    </div>
  );
}

function Column({ stage, tasks, db, onOpen, onAdd }: {
  stage: (typeof STAGES)[number]; tasks: Task[]; db: CoachDB;
  onOpen: (id: string) => void; onAdd?: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.key });
  return (
    <div className="flex w-[300px] min-w-[270px] flex-1 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: stage.accent }} />
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-stone-500" style={mono}>{stage.label}</span>
          <span className="font-mono text-[10px] text-stone-300" style={mono}>{tasks.length}</span>
        </div>
        {onAdd && (
          <button onClick={onAdd} className="font-mono text-[15px] leading-none text-stone-400 hover:text-[#A51C30]" title="Add task" style={mono}>＋</button>
        )}
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-[140px] flex-col gap-2 rounded-[12px] border border-dashed p-2 transition-colors ${
          isOver ? "border-[#A51C30]/40 bg-[#faf0f1]/50" : "border-stone-200 bg-stone-50/40"
        }`}
      >
        {tasks.length === 0 ? (
          <div className="grid flex-1 place-items-center py-6 font-mono text-[9px] uppercase tracking-[0.14em] text-stone-300" style={mono}>Drop here</div>
        ) : (
          tasks.map((t) => <DraggableCard key={t.id} db={db} task={t} accent={stage.accent} onOpen={() => onOpen(t.id)} />)
        )}
      </div>
    </div>
  );
}

export function BoardPanel({ db, mutate, setOverlay, weekKey }: {
  db: CoachDB;
  mutate: (fn: (draft: CoachDB) => void) => void;
  setOverlay: (o: Overlay) => void;
  weekKey: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const tasks = useMemo(() => db.tasks.filter((t) => t.week === weekKey), [db.tasks, weekKey]);
  const byStage = (s: TaskStage) => tasks.filter((t) => t.stage === s);
  const activeTask = activeId ? db.tasks.find((t) => t.id === activeId) : null;

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const overId = e.over?.id;
    if (overId == null) return;
    const target = String(overId) as TaskStage;
    if (!STAGES.some((s) => s.key === target)) return;
    const id = String(e.active.id);
    const t = db.tasks.find((x) => x.id === id);
    if (!t || t.stage === target) return;
    const nowISO = new Date().toISOString();
    mutate((draft) => {
      const dt = draft.tasks.find((x) => x.id === id);
      if (dt) applyStage(dt, target, nowISO);
    });
  }

  function addTodo() {
    const id = uid("t");
    mutate((draft) =>
      draft.tasks.push({
        id, goalId: "", week: weekKey, label: "New task", pts: 1, note: "", tag: "",
        done: false, doneAt: null, stage: "todo", subs: [], collapsed: false,
        timeMs: 0, timerStart: null, createdAt: new Date().toISOString(),
      }),
    );
    setOverlay({ kind: "task", id });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex gap-4 overflow-x-auto pb-2">
        {STAGES.map((s) => (
          <Column
            key={s.key}
            stage={s}
            db={db}
            tasks={byStage(s.key)}
            onOpen={(id) => setOverlay({ kind: "task", id })}
            onAdd={s.key === "todo" ? addTodo : undefined}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="w-[280px] rotate-1">
            <BoardCard db={db} task={activeTask} accent={STAGES.find((s) => s.key === activeTask.stage)?.accent ?? "#8a8a83"} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
