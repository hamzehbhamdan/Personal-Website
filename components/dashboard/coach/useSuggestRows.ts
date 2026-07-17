// components/dashboard/coach/useSuggestRows.ts
//
// Shared askAi -> parseList -> tap-to-add-rows state machine (Task 19). Ports the
// shape common to coach.html:603-612 (`suggestTasks`, used by GoalModal's
// "Suggest tasks") and coach.html:649-656 (the suggest-goals branch of `doCoach`,
// used by CoachPanel's Chat tab): call `askAi(task, prompt, data)`, `parseList`
// the reply, track a loading state and a null/"unavailable" state, and expose
// tap-to-add rows that each fire once. Suggestion extraction never sends a
// `system` persona (mirrors both call sites in the artifact).
//
// Callers own what "add" means (GoalModal lazily creates the goal + pushes a task
// + registers weekPlan; CoachPanel pushes a new goal) — this hook only owns the
// fetch/parse/loading/error/added-index bookkeeping, not the mutation itself.
"use client";
import { useState } from "react";
import { askAi, type AiTask } from "@/lib/dashboard/coach/ai";
import { parseList } from "@/lib/dashboard/coach/parse";

export interface UseSuggestRows {
  suggesting: boolean;
  items: string[] | null;
  error: string | null;
  addedIdx: Set<number>;
  /** Fire the suggestion request; resets prior items/error/addedIdx first. */
  run: (task: AiTask, prompt: string, data?: unknown) => Promise<void>;
  /** Tap-to-add a row once: invokes `onAdd(label)` then marks it added. No-op if
   *  there are no items, the index is out of range, or it was already added. */
  add: (idx: number, onAdd: (label: string) => void) => void;
  /** Clear all suggestion state (e.g. when another surface's request starts). */
  reset: () => void;
}

export function useSuggestRows(): UseSuggestRows {
  const [suggesting, setSuggesting] = useState(false);
  const [items, setItems] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addedIdx, setAddedIdx] = useState<Set<number>>(new Set());

  async function run(task: AiTask, prompt: string, data?: unknown) {
    setSuggesting(true);
    setError(null);
    setItems(null);
    setAddedIdx(new Set());
    const text = await askAi(task, prompt, data);
    setSuggesting(false);
    if (text === null) {
      setError("The coach is unavailable right now.");
      return;
    }
    setItems(parseList(text));
  }

  function add(idx: number, onAdd: (label: string) => void) {
    if (!items || idx < 0 || idx >= items.length || addedIdx.has(idx)) return;
    onAdd(items[idx]);
    setAddedIdx((prev) => new Set(prev).add(idx));
  }

  function reset() {
    setSuggesting(false);
    setItems(null);
    setError(null);
    setAddedIdx(new Set());
  }

  return { suggesting, items, error, addedIdx, run, add, reset };
}
