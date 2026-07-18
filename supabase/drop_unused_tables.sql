-- =============================================================
-- drop_unused_tables.sql — remove 5 dead relational tables from the LIVE DB.
--
-- Owner confirmed (2026-07): the pre-redesign dashboard was NEVER used in
-- production and all 5 of these tables are EMPTY — no data to lose. (Corollary:
-- `profiles` is empty despite an existing auth account, so there is no
-- handle_new_user trigger to break by dropping it.)
--
-- Run this ONCE in the Supabase SQL editor. Claude has no access to your live
-- DB and did not run it. schema.sql has already been updated to stop defining
-- these tables, so a fresh bootstrap won't recreate them.
--
-- Unused by all current code (only the removed pre-redesign components ever
-- referenced them; the live app persists to `app_state`):
--     profiles, notes, focus_sessions, neural_chats, calendar_events
--
-- PRESERVED (still in schema.sql): tasks, projects, sprints, subtasks,
--   contacts, contact_connections — back the TaskBoard + contacts-graph views
--   you plan to re-integrate (and tasks/contacts are read by /api/chat tools).
-- LIVE — never touch: documents, user_vector_stores, app_state, google_tokens
-- =============================================================

-- Optional final sanity check — expect 0 in every column before dropping.
select
  (select count(*) from public.profiles)        as profiles,
  (select count(*) from public.notes)           as notes,
  (select count(*) from public.focus_sessions)  as focus_sessions,
  (select count(*) from public.neural_chats)    as neural_chats,
  (select count(*) from public.calendar_events) as calendar_events;

-- Drop (confirmed empty). No CASCADE: none of these are FK targets of a
-- preserved table, so a plain DROP is safe and will error out rather than
-- silently cascade if that ever changes.
drop table if exists public.profiles;
drop table if exists public.notes;
drop table if exists public.focus_sessions;
drop table if exists public.neural_chats;
drop table if exists public.calendar_events;
