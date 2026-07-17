// components/dashboard/coach/overlay.ts
//
// Shared UI-only types for the Coach view tree (type-only, no runtime code).
// Created in Task 14 so CoachView, PeriodBar, and the not-yet-built board/modal
// components (Tasks 16–23) can all import the same `Overlay` discriminated union
// and mutation/callback shapes without CoachView having to import components that
// don't exist yet.
import type { CoachDB, Horizon } from "@/lib/dashboard/coach/types";

export type Overlay =
  | { kind: "none" }
  | { kind: "goal"; id?: string; parentForNew?: string }
  | { kind: "task"; id: string }
  | { kind: "sub"; taskId: string; subId: string }
  | { kind: "pickGoal" }
  | { kind: "coach" }
  | { kind: "intake"; horizons: Horizon[] }
  | { kind: "rollforward" }
  | { kind: "insights" };

export type Mutate = (fn: (draft: CoachDB) => void) => void;
export type SetOverlay = (o: Overlay) => void;
export type JumpTo = (h: Horizon, o: number) => void;
