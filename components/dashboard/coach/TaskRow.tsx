// components/dashboard/coach/TaskRow.tsx
//
// Ports coach.html:399–409 (`taskHtml` markup) plus the two binding sites that
// wire it up: `bindWeek` (:410–427, week board) and `bindExpandedTasks`
// (:498–507, expanded higher-horizon goal cards). Verified against the source:
// the two binding sites are byte-for-byte identical EXCEPT the subtask checkbox
// (`data-subcheck`) — that is the only handler in this file that branches on
// `surface`. Everything else (parent checkbox, collapse, timer controls, delete,
// add-sub) is shared behavior regardless of which board mounts the row.
//
// Reused by the week board (Task 16) and the expanded higher-horizon goal cards
// (Task 17) — neither mounts this component yet, so it only needs to typecheck
// here.
"use client";
import { useState } from "react";
import type { CoachDB, Sub, Task } from "@/lib/dashboard/coach/types";
import type { Mutate } from "./overlay";
import { taskDone, taskPts, taskTime } from "@/lib/dashboard/coach/rollup";
import { fmtDur, pauseTimer, resetTimer, startTimer } from "@/lib/dashboard/coach/timers";
import { uid } from "@/lib/dashboard/coach/migrate";
import { stageForDone } from "@/lib/dashboard/coach/board";
import { Badge, Card } from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";

const mono = { fontFamily: "var(--font-geist-mono), monospace" };

const ctrlBtn =
  "flex h-[27px] w-[27px] items-center justify-center rounded-[7px] border border-stone-200 text-[13px] text-[#A51C30] hover:border-[#A51C30]";

function CheckIcon({ visible }: { visible: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={11}
      height={11}
      strokeWidth={3.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("fill-none stroke-white", visible ? "opacity-100" : "opacity-0")}
    >
      <polyline points="4,12 10,18 20,6" />
    </svg>
  );
}

function SubRow({
  sub,
  onToggle,
  onEdit,
  onDelete,
}: {
  sub: Sub;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group/sub flex items-center gap-[8px] py-[3px]">
      <button
        type="button"
        role="checkbox"
        aria-checked={sub.done}
        aria-label={sub.done ? "Mark subtask not done" : "Mark subtask done"}
        onClick={onToggle}
        className={cn(
          "grid h-[16px] w-[16px] flex-none place-items-center rounded-[6px] border-2",
          sub.done ? "border-[#A51C30] bg-[#A51C30]" : "border-[#cbc4b5] bg-transparent",
        )}
      >
        <CheckIcon visible={sub.done} />
      </button>
      <span
        onClick={onEdit}
        className={cn(
          "cursor-pointer text-[12.5px]",
          sub.done ? "text-stone-400 line-through" : "text-stone-700",
        )}
      >
        {sub.label}
      </span>
      {sub.meta && <span className="text-[11px] text-stone-400">{sub.meta}</span>}
      <Badge tone="neutral">+{sub.pts || 0}</Badge>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete subtask"
        className="ml-auto border-none bg-transparent text-[11px] text-stone-400 opacity-0 transition-opacity group-hover/sub:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}

export function TaskRow({
  task,
  surface,
  db,
  mutate,
  tickNow,
  onEdit,
  onEditSub,
}: {
  task: Task;
  surface: "week" | "expanded";
  // Not read by this row's own markup (parity with `taskHtml`, which only takes
  // `t`) — carried so callers can pass the same `db` they already have on hand.
  db: CoachDB;
  mutate: Mutate;
  tickNow: number;
  onEdit: (id: string) => void;
  onEditSub: (taskId: string, subId: string) => void;
}) {
  void db;
  const [subDraft, setSubDraft] = useState("");

  const grp = task.subs.length > 0;
  const done = taskDone(task);
  const running = task.timerStart != null;
  const elapsed = taskTime(task, tickNow);

  const findDraftTask = (draft: CoachDB) => draft.tasks.find((x) => x.id === task.id);

  // Parent checkbox (`data-check`) — identical on both surfaces
  // (coach.html:411 == :500 == :499 in bindExpandedTasks).
  function toggleParentCheck() {
    mutate((draft) => {
      const t = findDraftTask(draft);
      if (!t) return;
      const nd = !taskDone(t);
      t.subs.forEach((s) => { s.done = nd; });
      t.done = nd;
      t.doneAt = nd ? new Date().toISOString() : null;
      t.stage = stageForDone(nd, t.stage);
      if (nd && t.timerStart) pauseTimer(t);
    });
  }

  // Subtask checkbox (`data-subcheck`) — the ONE surface divergence.
  // week (coach.html:412): toggle, then recompute parent doneAt + auto-pause.
  // expanded (coach.html:500): toggle only, no doneAt/auto-pause side effects.
  function toggleSubCheck(subId: string) {
    mutate((draft) => {
      const t = findDraftTask(draft);
      if (!t) return;
      const s = t.subs.find((x) => x.id === subId);
      if (!s) return;
      s.done = !s.done;
      const nowDone = taskDone(t);
      t.done = nowDone;                          // raw flag mirrors effective done-ness
      t.stage = stageForDone(nowDone, t.stage);  // board column follows (both surfaces)
      if (surface === "week") {
        if (nowDone && t.timerStart) pauseTimer(t);
        t.doneAt = nowDone ? new Date().toISOString() : null;
      }
    });
  }

  // Collapse chevron (group only) — persisted (coach.html:413 / :507).
  function toggleCollapse() {
    mutate((draft) => {
      const t = findDraftTask(draft);
      if (t) t.collapsed = !t.collapsed;
    });
  }

  function handlePlay() {
    mutate((draft) => startTimer(draft.tasks, task.id));
  }

  function handlePause() {
    mutate((draft) => {
      const t = findDraftTask(draft);
      if (t) pauseTimer(t);
    });
  }

  function handleReset() {
    mutate((draft) => {
      const t = findDraftTask(draft);
      if (t) resetTimer(t);
    });
  }

  function handleDeleteTask() {
    mutate((draft) => {
      draft.tasks = draft.tasks.filter((x) => x.id !== task.id);
    });
  }

  function handleDeleteSub(subId: string) {
    mutate((draft) => {
      const t = findDraftTask(draft);
      if (!t) return;
      t.subs = t.subs.filter((x) => x.id !== subId);
      t.done = taskDone(t);
      t.stage = stageForDone(t.done, t.stage);
    });
  }

  function commitAddSub() {
    const label = subDraft.trim();
    if (!label) return;
    mutate((draft) => {
      const t = findDraftTask(draft);
      if (!t) return;
      t.subs.push({ id: uid("s"), label, pts: 1, meta: "", done: false });
      t.done = taskDone(t);
      t.stage = stageForDone(t.done, t.stage);
    });
    setSubDraft("");
  }

  return (
    <Card className={cn("group mb-[7px] px-[11px] py-[9px]", running && "border-[#A51C30]")}>
      <div className="flex items-start gap-[10px]">
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-label={done ? "Mark task not done" : "Mark task done"}
          onClick={toggleParentCheck}
          className={cn(
            "mt-[1px] grid h-[19px] w-[19px] flex-none place-items-center rounded-[6px] border-2",
            done ? "border-[#A51C30] bg-[#A51C30]" : "border-[#cbc4b5] bg-transparent",
          )}
        >
          <CheckIcon visible={done} />
        </button>

        {grp && (
          <button
            type="button"
            onClick={toggleCollapse}
            aria-label={task.collapsed ? "Expand subtasks" : "Collapse subtasks"}
            className={cn(
              "mt-[5px] flex-none text-[9px] text-stone-400 transition-transform",
              task.collapsed ? "rotate-0" : "rotate-90",
            )}
          >
            ▸
          </button>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-[7px]">
            <span
              onClick={() => onEdit(task.id)}
              className={cn(
                "cursor-pointer text-[13.5px] font-semibold hover:text-[#A51C30]",
                done ? "text-stone-400 line-through" : "text-stone-900",
              )}
            >
              {task.label}
            </span>
            {task.tag && <Badge tone="neutral">{task.tag}</Badge>}
            <Badge tone="neutral">{grp ? `${taskPts(task)} pt` : `${task.pts || 0} pt est`}</Badge>
            <button
              type="button"
              onClick={handleDeleteTask}
              aria-label="Delete task"
              className="ml-auto border-none bg-transparent text-[12px] text-stone-400 opacity-0 transition-opacity group-hover:opacity-100"
            >
              ✕
            </button>
          </div>
          {task.note && <div className="mt-[2px] text-[12px] text-stone-400">{task.note}</div>}
        </div>
      </div>

      <div className="ml-[29px] mt-[7px] flex items-center gap-[7px]">
        <span
          data-ttime={task.id}
          style={mono}
          className={cn("text-[14px] font-semibold", running ? "text-[#A51C30]" : "text-stone-400")}
        >
          {fmtDur(elapsed)}
        </span>
        <span className="text-[10.5px] text-stone-400">
          {running ? "running" : elapsed > 0 ? "tracked" : "not started"}
        </span>
        <span className="ml-auto flex gap-[6px]">
          {running ? (
            <button type="button" onClick={handlePause} title="Pause" className={ctrlBtn}>
              ⏸
            </button>
          ) : (
            <button type="button" onClick={handlePlay} title="Start" className={ctrlBtn}>
              ▶
            </button>
          )}
          <button type="button" onClick={handleReset} title="Reset" className={cn(ctrlBtn, "text-stone-400")}>
            ↺
          </button>
        </span>
      </div>

      {grp && (
        <div
          className={cn(
            "mb-[2px] ml-[29px] mt-[3px] border-l-2 border-[#f0eeea] pl-[8px]",
            task.collapsed && "hidden",
          )}
        >
          {task.subs.map((s) => (
            <SubRow
              key={s.id}
              sub={s}
              onToggle={() => toggleSubCheck(s.id)}
              onEdit={() => onEditSub(task.id, s.id)}
              onDelete={() => handleDeleteSub(s.id)}
            />
          ))}
          <div className="mt-[4px] flex gap-[6px]">
            <input
              value={subDraft}
              onChange={(e) => setSubDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitAddSub();
              }}
              placeholder="add a subtask…"
              className="flex-1 rounded-[8px] border border-stone-200 px-[9px] py-[6px] text-[12.5px] outline-none focus:border-[#A51C30]"
            />
            <button
              type="button"
              onClick={commitAddSub}
              className="rounded-[8px] border border-stone-200 px-[11px] font-semibold text-[#A51C30] hover:border-[#A51C30]"
            >
              +
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
