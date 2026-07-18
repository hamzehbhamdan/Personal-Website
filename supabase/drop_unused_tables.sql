-- =============================================================
-- drop_unused_tables.sql — OPTIONAL cleanup of dead relational tables.
--
-- ⚠ DESTRUCTIVE + IRREVERSIBLE. Run manually in the Supabase SQL editor,
-- and ONLY after STEP 1 confirms each table is empty. Claude cannot run this
-- for you (no access to your live DB) and did not execute it.
--
-- Context: the redesign moved live data into the `app_state` JSONB store, so a
-- number of the original relational tables are no longer read or written by any
-- current code path (verified by grepping every .from("<table>") / .rpc site).
--
-- SCOPE DECISION (important):
--   These 5 tables are dropped because they are BOTH unused today AND unrelated
--   to the two features you want to re-integrate later:
--       profiles, notes, focus_sessions, neural_chats, calendar_events
--
--   DELIBERATELY PRESERVED (do NOT drop — the TaskBoard + contacts graph views
--   you plan to re-integrate depend on these, even though current code doesn't
--   query them yet):
--       tasks, projects, sprints, subtasks   (TaskBoard)
--       contacts, contact_connections        (contacts network graph)
--
--   LIVE — never touch:
--       documents, user_vector_stores, app_state, google_tokens
-- =============================================================

-- ---------------------------------------------------------------
-- STEP 1 — VERIFY EMPTY (run this first; expect 0 for every count).
-- If any count is > 0, STOP and export/inspect that table before dropping.
-- ---------------------------------------------------------------
select
  (select count(*) from public.profiles)        as profiles,
  (select count(*) from public.notes)           as notes,
  (select count(*) from public.focus_sessions)  as focus_sessions,
  (select count(*) from public.neural_chats)    as neural_chats,
  (select count(*) from public.calendar_events) as calendar_events;

-- ---------------------------------------------------------------
-- STEP 2 — DROP (only after STEP 1 shows all zeros).
-- Uncomment the block below to execute. No CASCADE: none of these are FK
-- targets of any preserved table, so a plain DROP is safe and will error out
-- (rather than silently cascade) if that assumption ever changes.
-- ---------------------------------------------------------------
-- drop table if exists public.profiles;
-- drop table if exists public.notes;
-- drop table if exists public.focus_sessions;
-- drop table if exists public.neural_chats;
-- drop table if exists public.calendar_events;
