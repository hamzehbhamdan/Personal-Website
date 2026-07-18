# Coach Task Board + Metrics, and People Network Graph

**Date:** 2026-07-17
**Status:** Design — awaiting review
**Author:** Hamzeh (with Claude)

---

## 1. Overview

Three capabilities from the pre-redesign dashboard are being reintroduced — but rebuilt to live *inside* the current editorial platform and its per-app JSON-blob data model, not bolted on as the old relational-table components were. The old [`TaskBoard.tsx`](../../../components/dashboard/TaskBoard.tsx), [`TaskStats.tsx`](../../../components/dashboard/TaskStats.tsx), and [`NetworkGraph.tsx`](../../../components/dashboard/NetworkGraph.tsx) remain in the repo and are mined for interaction logic, but every visual is rebuilt with the editorial `components/dashboard/ui/*` primitives.

The three capabilities:

- **A. Coach Task Board** — a To Do / In Progress / Done kanban of the Executive Coach's tasks, as a new sub-view of the Coach.
- **B. Coach Metrics** — a KPI / metrics sub-view of the Coach (completion, points, pace, streak, focus time).
- **C. People Network** — a force-directed graph of which contacts know each other, plus a fast way to assert "everyone in this set knows each other" over **either a group or an ad-hoc list of contacts**.

### 1.1 Decisions locked in brainstorming

| Decision | Choice |
|---|---|
| Board organization | **Status kanban** — To Do / In Progress / Done, drag to change stage |
| Board task model | Add `stage` to Coach `Task`; **`done` stays the completion source of truth**, `stage` mirrors/refines it (invariant `stage==="done" ⇔ done===true`) |
| Board scope | **Week-scoped** — the board shows the selected week's tasks, reusing the existing period/`PeriodBar` logic |
| Metrics placement | **Coach sub-tab**, computed from `CoachDB` + existing `pace.ts`/`rollup.ts` |
| Metrics visuals | Editorial `ui/Stat` + `ui/Ring` (NOT `react-circular-progressbar`); reuse `TaskStats`' metric *math*, not its JSX |
| Relationship model | **Explicit stored edges** on `CrmDB.connections` (undirected); co-membership never auto-creates edges |
| Clique action | "Everyone here knows each other" works over **a group's members OR an ad-hoc multi-selected list** of contacts; idempotent |
| Graph home | New **Network** tab inside People |
| Aesthetic | Editorial system only — `ui/*` primitives, `#A51C30` accent, stone neutrals, **no framer-motion**, no glass |

### 1.2 Non-negotiable integration constraints

1. **No relational tables.** The dropped tables (`tasks`, `contact_connections`, …) are not revived. All new state lives in the existing `app_state` blobs (`execCoach`, `lifeCRM`) via [`useAppState`](../../../lib/dashboard/useAppState.ts).
2. **`normalizeDb` is the schema gate.** Any new top-level field on `CrmDB` that is not added to the explicit return literal in [`normalizeDb`](../../../lib/dashboard/people/backup.ts) is silently stripped on every load. New fields must be threaded through the type, `emptyDb()`, **and** `normalizeDb()`.
3. **Editorial primitives only.** New surfaces follow the `components/dashboard/<feature>/` + `components/dashboard/ui/*` pattern (see [design-system reference](#8-design-system-conformance)). No framer-motion; CSS transitions only.
4. **Migrations are additive + idempotent.** Coach data migrates via a version bump in [`migrate.ts`](../../../lib/dashboard/coach/migrate.ts); People data self-heals in `normalizeDb`.

---

## 2. Scope & decomposition

Three feature slices, built and reviewed in order. Each is independently shippable and gets its own section of the implementation plan.

1. **Slice A — Coach Task Board** (§5). Adds the `stage` field + migration, the Coach sub-view switch, and the kanban.
2. **Slice B — Coach Metrics** (§6). Small; builds on the same Coach sub-view switch and existing metric logic.
3. **Slice C — People Network + clique** (§7). Largest — the net-new edge store, the graph, and the Link modal.

Slices A and B share the Coach sub-view scaffold (§5.1) and should land together or A-then-B. Slice C is independent of A/B.

---

## 3. Current-state facts this design depends on

- **Coach `Task`** ([`coach/types.ts`](../../../lib/dashboard/coach/types.ts)): `{ id, goalId, week, label, pts, note, tag, done, doneAt, subs, collapsed, timeMs, timerStart, createdAt }`. **No status field.** `CoachDB.version === 3`. Tasks are keyed to a `week` period string (e.g. `"W2026-07-06"`).
- **Coach persistence**: `useAppState<CoachDB>("execCoach", …)`; mutations via an Immer-style `mutate((draft) => void)` passed to modals ([`coach/overlay.ts`](../../../components/dashboard/coach/overlay.ts)).
- **Coach view**: [`CoachView.tsx`](../../../components/dashboard/coach/CoachView.tsx) uses `Segmented<Horizon>` (week/month/quarter/year) + `PeriodBar` + `{horizon==="week" ? <WeekBoard/> : <HigherHorizon/>}`; modals via an `Overlay` discriminated union rendered at the bottom.
- **People `Contact`** ([`people/types.ts`](../../../lib/dashboard/people/types.ts)): `{ id, name, emails[], phone?, tier, cadenceDays?, birthday?, howWeMet?, tags[], notes?, avatarImg?, lastTouch, snoozeUntil, log[] }`. **No connections field.**
- **`CrmDB`**: `{ version, contacts[], groups[], dismissed[], tiers[], settings }`. **No edge store.** `Group` is first-class: `{ id, name, type:"manual"|"smart", rule, members[], … }`; `membersOf(db, g)` ([`groups.ts`](../../../lib/dashboard/people/groups.ts)) resolves membership.
- **People persistence**: `useAppState<CrmDB>("lifeCRM", emptyDb())`; snapshot via `db = useMemo(() => normalizeDb(raw), [raw])`; writes re-derive with `normalizeDb(prev)` inside the updater.
- **Salvage donors** (still in repo, imported by nothing): `TaskBoard.tsx` (dnd-kit kanban, `TaskCard`, `filteredTasks`), `TaskStats.tsx` (metric engine), `NetworkGraph.tsx` (hand-rolled force sim + org-clique loop at lines 139–145), `ConnectionManagerModal.tsx` (pair dedup). Their Supabase/`/api/neural-sort` coupling is dead and dropped.

---

## 4. Shared data-model changes

### 4.1 Coach: `Task.stage`

```ts
// lib/dashboard/coach/types.ts
export type TaskStage = "todo" | "doing" | "done";
export interface Task {
  // …existing fields…
  stage: TaskStage;   // NEW. Invariant: stage==="done"  ⇔  done===true
}
// CoachDB.version bumps 3 → 4
```

**Invariant & sync.** `done` remains authoritative for completion (read by `pace.ts`, `rollup.ts`, points, `WeekBoard`, `TaskRow`). `stage` is an additional lens that must never contradict it. A single helper module owns the coupling:

```ts
// lib/dashboard/coach/board.ts  (NEW, pure)
export const STAGES: { key: TaskStage; label: string; accent: string }[] = [
  { key: "todo",  label: "To Do",       accent: "#8a8a83" },
  { key: "doing", label: "In Progress", accent: "#A51C30" },
  { key: "done",  label: "Done",        accent: "#1c7c54" },
];
// Apply a stage change, keeping done/doneAt consistent (mutates a draft task):
export function applyStage(t: Task, stage: TaskStage, nowISO: string): void;
//   stage==="done"  → done=true,  doneAt = t.doneAt ?? nowISO, stage="done"
//   stage!=="done"  → done=false, doneAt = null,               stage=stage
// Keep stage aligned when done is toggled elsewhere (e.g. TaskRow checkbox):
export function stageForDone(done: boolean, prev: TaskStage): TaskStage;
//   done → "done";  !done → (prev==="done" ? "todo" : prev)
```

The existing done-toggle path (`TaskRow`/week board) is updated to also set `stage` via `stageForDone`, so completing a task anywhere moves its board card to Done and vice-versa.

**Migration** ([`migrate.ts`](../../../lib/dashboard/coach/migrate.ts), v3→v4): for every task, `stage = t.stage ?? (t.done ? "done" : "todo")`, then enforce the invariant (`if (t.done) t.stage = "done"; else if (t.stage === "done") t.stage = "todo"`). Idempotent.

### 4.2 People: `CrmDB.connections`

```ts
// lib/dashboard/people/types.ts
export interface Edge { a: string; b: string }   // undirected; canonical a < b
export interface CrmDB {
  // …existing fields…
  connections: Edge[];   // NEW
}
```

Threaded through **all three** gates:
- `emptyDb()` ([`backup.ts`](../../../lib/dashboard/people/backup.ts)): add `connections: []`.
- `normalizeDb()`: add an explicit `connections:` line to the return literal (or it is stripped). Normalization: coerce to array; for each edge canonicalize so `a < b`; drop self-loops (`a === b`); drop edges whose `a` or `b` is not a current contact id; dedup by `${a}|${b}`.
- `CrmDB` type: as above.

All edge logic is a pure module:

```ts
// lib/dashboard/people/connections.ts  (NEW, pure)
export function canonEdge(a: string, b: string): Edge | null;      // null if a===b
export function edgeKey(e: Edge): string;                          // `${a}|${b}` (canonical)
export function hasEdge(edges: Edge[], a: string, b: string): boolean;
export function addEdge(edges: Edge[], a: string, b: string): Edge[];    // idempotent
export function removeEdge(edges: Edge[], a: string, b: string): Edge[];
export function cliqueEdges(ids: string[]): Edge[];               // all n·(n-1)/2 canonical pairs
export function mergeClique(edges: Edge[], ids: string[]): Edge[]; // idempotent union
export function neighbors(edges: Edge[], id: string): string[];
export function pruneEdges(edges: Edge[], contactIds: Set<string>): Edge[]; // used by normalizeDb
```

---

## 5. Slice A — Coach Task Board

### 5.1 Coach sub-view switch (shared with Slice B)

`CoachView` gains a top-level sub-view selector **above** the existing horizon controls:

```
<PageContainer>
  <ViewHeader meta="Executive Coach" title="Coach" actions={…} />
  <Segmented options={[{value:"plan",label:"Plan"},{value:"board",label:"Board"},{value:"metrics",label:"Metrics"}]}
            value={pane} onChange={setPane} />
  {pane === "plan"    && <>{/* existing: Segmented<Horizon> + PeriodBar + WeekBoard/HigherHorizon */}</>}
  {pane === "board"   && <BoardPanel db=… mutate=… setOverlay=… weekKey=… onWeekChange=… />}
  {pane === "metrics" && <MetricsPanel db=… weekKey=… onWeekChange=… />}
</PageContainer>
```

- `const [pane, setPane] = useState<"plan"|"board"|"metrics">("plan")`.
- "Plan" is **today's CoachView content, unchanged** (horizon Segmented + `PeriodBar` + `WeekBoard`/`HigherHorizon`).
- Board and Metrics **share one selected-week state owned by `CoachView`** (so switching between them keeps the same week). Each renders a compact week `PeriodBar` (prev/next) bound to that shared state, separate from the Plan tab's horizon selector.
- The existing `Overlay` union and its modal-render block stay; `BoardPanel` opens task editing through the **existing** `TaskModal` via `setOverlay({ kind: "task", id })`.

### 5.2 `BoardPanel.tsx`

`components/dashboard/coach/BoardPanel.tsx` (NEW). Renders three columns from `STAGES` (§4.1). Tasks for the panel = `db.tasks.filter(t => t.week === weekKey)`, bucketed by `t.stage`. Salvaged from `TaskBoard.tsx` (rewritten to the blob model + editorial styling):

- **dnd-kit wiring** (`TaskBoard.tsx:219–257, 601–621, 1020–1077`): `useSensors(PointerSensor, KeyboardSensor)`, `DndContext` + `closestCorners` + `DragOverlay`, droppable `Column` via `useSortable`, sortable card via `useSortable`.
- **Drag end**: dropping a card on a column (or on a card in another column) → `mutate(d => applyStage(findTask(d,id), targetStage, nowISO()))`. Same-column reordering is **not persisted in v1** (cards sort by `createdAt`; see §9 out-of-scope).
- **Column** = colored header pill + live count + dashed empty-drop placeholder, restyled as editorial (`ui/Card` container, `MonoLabel` header, stone hairlines, stage accent).
- **Card** = new `components/dashboard/coach/BoardCard.tsx`: goal chip (via `rollup` `getGoal`), points, subtask progress (`subs` done/total, thin stone/crimson bar — CSS width, no framer-motion), a running-timer indicator when `timerStart != null`. Click → `setOverlay({kind:"task", id})`.
- **Add task**: a per-column "＋" seeds a new task into `weekKey` with `stage:"todo"` (via the existing task-create path / `TaskModal` in create mode). New "todo" column CTA mirrors WeekBoard's add affordance.

### 5.3 Interaction with existing surfaces

- Completing a task from `WeekBoard`/`TaskRow` now also sets `stage` (§4.1), so the board reflects it.
- The board writes only `stage`/`done`/`doneAt`; it does not touch `week`, `goalId`, points, or timers except through the existing `TaskModal`.

---

## 6. Slice B — Coach Metrics

### 6.1 `metrics.ts` (pure)

```ts
// lib/dashboard/coach/metrics.ts  (NEW, pure)
export interface WeekMetrics {
  total: number; done: number; completionPct: number;  // 0..100
  pointsEarned: number;   // Σ effective pts of done tasks (sub-rollup aware)
  pointsPlanned: number;  // Σ effective pts of all tasks this week
  focusMs: number;        // Σ timeMs this week
  doing: number; todo: number;
}
export function weekMetrics(db: CoachDB, weekKey: string): WeekMetrics;
export function streak(db: CoachDB): number;   // consecutive weeks (back from current) with planDone[weekKey]===true
export function statusLabel(pct: number): "On track" | "Building" | "Stalled"; // reuse TaskStats thresholds
```

Reuses effective-points logic already in `rollup.ts`/`pace.ts` (a task's points roll up from `subs` when present) and `planDone`/`weekPlan` for streaks. Pace-vs-plan comes from the existing `pace.ts`.

### 6.2 `MetricsPanel.tsx`

`components/dashboard/coach/MetricsPanel.tsx` (NEW). Editorial KPI layout:

- A `SectionHeader index="01" label="This week"`, then a row of `ui/Stat` tiles: **Completion** (with `ui/Ring`), **Tasks cleared** (`done/total`), **Points** (`pointsEarned/pointsPlanned`), **Focus time** (`Xh Ym` from `focusMs`), **Streak** (weeks), each `ui/Stat` with `MonoLabel`.
- A compact per-goal progress list (goal title + `ui/Ring`/bar) using `rollup` goal progress, for the current period.
- Its own week `PeriodBar`. No charts library; rings/bars are `ui/Ring` + CSS-width bars.

---

## 7. Slice C — People Network + clique

### 7.1 Edge store

Per §4.2 (`CrmDB.connections`, `connections.ts`, `normalizeDb` threading). This is the foundation; build it first in this slice with unit tests before any UI.

### 7.2 Network tab

A **Network** entry is added to `PeopleView`'s sub-view control (following its existing tab pattern; the plan confirms PeopleView's current structure and adds the tab consistently). The panel is `components/dashboard/people/NetworkPanel.tsx` (NEW).

- **Nodes** = `db.contacts`. Label = name; avatar via `avatarImg` else serif initial; **color and size by tier** using `tierColor(db, c.tier)` / `tierCad(db, c.tier)` ([`tiers.ts`](../../../lib/dashboard/people/tiers.ts)).
- **Edges** = `db.connections`, drawn as stone hairlines (crimson on hover/selection).
- **Layout** (salvaged from `NetworkGraph.tsx:151–287`): hand-rolled force sim — all-pairs repulsion (capped radius), spring attraction per edge (rest length ~100), center gravity; 300-iteration synchronous pre-warm on mount, then a `requestAnimationFrame` loop. Extracted layout math goes in `components/dashboard/people/graph-sim.ts` so the force step is unit-testable and the panel stays thin. **Performance note:** the salvaged loop re-runs O(n²) per frame; acceptable for the expected contact count (tens–low hundreds). If profiling shows jank, cap live iterations / freeze after settle (noted as a tuning task, not a v1 blocker).
- **Interactions** (salvaged): background-drag pan, node-drag (screen→graph coord transform), manual `+`/`−` zoom (wheel-zoom stays disabled). Node click → open the existing contact detail (`setOverlay`/People's contact modal). Hover → highlight incident edges + neighbors.
- **No framer-motion** — the salvaged version used it; rebuild node/edge rendering with plain elements + CSS transitions (SVG `<line>` edges, absolutely-positioned DOM nodes, as in the donor but de-motioned).

### 7.3 Edge creation & the clique action

Three paths:

1. **Draw an edge** — drag one node onto another → `mutate(db => ({...db, connections: addEdge(db.connections, a, b)}))`. Idempotent.
2. **"Everyone here knows each other"** — a Link modal (`components/dashboard/people/LinkModal.tsx`, NEW) reached from a Network-panel action ("Connect people"). Two modes in one modal:
   - **From a group** — pick an existing `Group`; members resolved via `membersOf(db, group)`.
   - **From a list** — an ad-hoc contact multi-select (search + checklist), for people who aren't a group. *(This is the user's explicit requirement: assert a clique over an arbitrary list, not only a group.)*
   - Either way, the modal previews the member count and **`newEdges` vs `alreadyConnected`** counts (`cliqueEdges` minus existing), then Confirm → `mutate(db => ({...db, connections: mergeClique(db.connections, ids)}))`. Idempotent; skips existing pairs.
3. **Remove an edge** — click an edge (or a node's neighbor row) → confirm → `removeEdge`.

Co-membership of a group never auto-creates edges; the clique is always an explicit action.

### 7.4 What is NOT reused from the donors

Everything Supabase-shaped: `contact_connections` I/O, the old `Contact` shape (`avatarColor`, `company`, `connections?: Connection[]`), the delete-all-then-reinsert save, the per-contact `<select>` "Link New Node" UX, the company-clique **auto**-inference (we make cliques explicit), and the "Neural" naming. BFS "degrees of separation" is deferred (§9).

---

## 8. Design-system conformance

New files live under `components/dashboard/coach/` and `components/dashboard/people/` and use the editorial primitives ([`components/dashboard/ui/*`](../../../components/dashboard/ui)): `PageContainer`, `ViewHeader`, `Segmented`, `SectionHeader`, `Card`, `Stat`, `Ring`, `Badge`, `Avatar`, `Modal`, `MonoLabel`. Buttons are the local `btnPrimary`/`btnGhost` class-string constants (copied per surface, as the codebase does). Accents hardcode `#A51C30`; neutrals are Tailwind `stone-*`. Radii: cards `rounded-[10px]`, buttons `rounded-[8px]`, modals `rounded-[14px]`. **No framer-motion, no glass, no `react-circular-progressbar`.** Modals go through `ui/Modal`; the Coach's existing `overlay.ts` union is extended only if a genuinely new modal type is needed (the board reuses `TaskModal`; the People `LinkModal` follows the Brain-style single-nullable-state pattern or People's existing overlay approach).

---

## 9. Out of scope (YAGNI)

- Eisenhower matrix, list view, sprint view on the board.
- Persisted manual card ordering within a column.
- Edge types / weights / labels / directionality.
- Graph wheel-zoom; BFS "degrees of separation" pathfinding (easy later add).
- Cross-app aggregate metrics (Coach + People + Brain) — Metrics stays Coach-scoped.
- Auto-inferring edges from group/company membership.

---

## 10. Testing

Pure logic gets vitest unit tests mirroring `test/coach/*` and `test/people/*`:

- `board.ts` — `applyStage` invariant (done/doneAt/stage consistency both directions), `stageForDone`.
- `migrate.ts` — v3→v4 backfill + idempotency + invariant enforcement.
- `connections.ts` — `canonEdge`, `addEdge`/`removeEdge` idempotency, `cliqueEdges` count = n·(n-1)/2, `mergeClique` skips existing, `pruneEdges` drops dangling.
- `backup.ts` `normalizeDb` — round-trips `connections`, canonicalizes, drops self-loops/dangling/dupes.
- `metrics.ts` — `weekMetrics` counts/points/focus, `streak`, `statusLabel` thresholds.
- `graph-sim.ts` — a force step reduces overlap / converges for a small fixture (light).

UI (board drag, graph render, Link modal) is verified in the browser preview per the harness verification workflow.

---

## 11. Risks & open questions

- **`stage`/`done` dual-write** is the main correctness risk; mitigated by funneling every completion change through `applyStage`/`stageForDone` and unit-testing the invariant.
- **PeopleView tab structure** — the plan must confirm how PeopleView currently switches sub-views and add "Network" the same way (avoid a second, divergent tab mechanism).
- **Graph performance** at higher contact counts — acceptable for now; settle-then-freeze is the fallback.
- **Board period scope** — v1 shows one week at a time (matches the Coach's model); a future "all open tasks" toggle is possible but out of scope.
