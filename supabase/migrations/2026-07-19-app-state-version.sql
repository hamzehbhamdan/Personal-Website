-- Optimistic concurrency for app_state (code review 2026-07-19, findings #16/#17).
-- Apply once in the Supabase SQL editor BEFORE deploying the /api/state route
-- change. Idempotent — safe to re-run. Re-run the UPDATE once more right after
-- the deploy goes live to catch any row the OLD code inserted (at default 0)
-- in the window between migration and deploy.

alter table public.app_state
  add column if not exists version bigint not null default 0;

-- Backfill is load-bearing, not cosmetic: the API treats baseVersion 0 as
-- "no row exists yet" (insert path, 409 on conflict). A pre-existing row left
-- at version 0 would livelock — the client GETs version 0, takes the insert
-- path, 409s, re-GETs 0, and repeats forever. Bump every existing row to 1 so
-- a stored version is always >= 1 and 0 unambiguously means "row absent".
update public.app_state set version = 1 where version = 0;
