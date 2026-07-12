-- =============================================================
-- 0001_harden_rls.sql — strip the nil-UUID backdoor, scope every table to the owner.
-- RUN IN THE SUPABASE SQL EDITOR (needs table-owner privileges). It is wrapped in a
-- single transaction: inspect the STEP 1 counts, then let it COMMIT (or ROLLBACK).
--
-- >>> BEFORE RUNNING: replace OWNER_EMAIL_HERE (1 occurrence) with your ALLOWED_EMAIL
--     (the email you log in with). If it is not found in auth.users the script aborts.
--
-- NOTE — two deliberate deviations from the A0 plan text, both verified against
-- supabase/schema.sql:
--   1. STEP 3 drops EVERY existing policy on each table (enumerated from pg_policies)
--      rather than dropping fixed names. The live schema names several backdoor
--      policies differently than the plan assumed (contact_connections =
--      "Enable all for connections"; focus_sessions/neural_chats/user_vector_stores/
--      calendar_events use "...own focus sessions"/"...neural chats"/"...vector
--      stores"/"...own events"). Dropping by fixed name would LEAVE those permissive
--      nil-UUID policies in place — and Postgres OR-combines permissive policies, so
--      the backdoor would survive. Drop-all removes it regardless of name.
--   2. STEP 5 pins match_documents to `search_path = public, extensions` (not '').
--      pgvector's `<=>` operator lives in public/extensions; an empty search_path
--      leaves it unresolvable and the function errors. A pinned, non-mutable path to
--      trusted schemas satisfies the hardening intent while keeping the operator valid.
--   3. STEP 4 also drops ALL existing policies on `documents` by enumeration before
--      enabling RLS (it is currently RLS-disabled, so a dormant stray policy would
--      otherwise activate and OR-combine). STEP 1/END also audit + explicitly remove the
--      nil-UUID demo `profiles` row so STEP 6's cascade can't delete it un-audited.
-- =============================================================
begin;

-- Resolve the real owner id once.
do $$
declare owner uuid;
begin
  select id into owner from auth.users where email = 'OWNER_EMAIL_HERE';
  if owner is null then raise exception 'Owner email not found in auth.users'; end if;
  perform set_config('app.owner_id', owner::text, true);
end $$;

-- STEP 1 (audit): how many rows currently sit under the nil UUID? Inspect before COMMIT.
drop table if exists _nil_counts;
create temp table _nil_counts as
  select 'contacts' t, count(*) n from public.contacts where user_id = '00000000-0000-0000-0000-000000000000'
  union all select 'contact_connections', count(*) from public.contact_connections where user_id = '00000000-0000-0000-0000-000000000000'
  union all select 'tasks', count(*) from public.tasks where user_id = '00000000-0000-0000-0000-000000000000'
  union all select 'projects', count(*) from public.projects where user_id = '00000000-0000-0000-0000-000000000000'
  union all select 'notes', count(*) from public.notes where user_id = '00000000-0000-0000-0000-000000000000'
  union all select 'focus_sessions', count(*) from public.focus_sessions where user_id = '00000000-0000-0000-0000-000000000000'
  union all select 'neural_chats', count(*) from public.neural_chats where user_id = '00000000-0000-0000-0000-000000000000'
  union all select 'user_vector_stores', count(*) from public.user_vector_stores where user_id = '00000000-0000-0000-0000-000000000000'
  union all select 'sprints', count(*) from public.sprints where user_id = '00000000-0000-0000-0000-000000000000'
  union all select 'calendar_events', count(*) from public.calendar_events where user_id = '00000000-0000-0000-0000-000000000000'
  union all select 'profiles', count(*) from public.profiles where id = '00000000-0000-0000-0000-000000000000';
select * from _nil_counts;

-- STEP 2 (backfill): reassign all nil-UUID rows to the real owner.
update public.contacts            set user_id = current_setting('app.owner_id')::uuid where user_id = '00000000-0000-0000-0000-000000000000';
update public.contact_connections set user_id = current_setting('app.owner_id')::uuid where user_id = '00000000-0000-0000-0000-000000000000';
update public.tasks               set user_id = current_setting('app.owner_id')::uuid where user_id = '00000000-0000-0000-0000-000000000000';
update public.projects            set user_id = current_setting('app.owner_id')::uuid where user_id = '00000000-0000-0000-0000-000000000000';
update public.notes               set user_id = current_setting('app.owner_id')::uuid where user_id = '00000000-0000-0000-0000-000000000000';
update public.focus_sessions      set user_id = current_setting('app.owner_id')::uuid where user_id = '00000000-0000-0000-0000-000000000000';
update public.neural_chats        set user_id = current_setting('app.owner_id')::uuid where user_id = '00000000-0000-0000-0000-000000000000';
update public.user_vector_stores  set user_id = current_setting('app.owner_id')::uuid where user_id = '00000000-0000-0000-0000-000000000000';
update public.sprints             set user_id = current_setting('app.owner_id')::uuid where user_id = '00000000-0000-0000-0000-000000000000';
update public.calendar_events     set user_id = current_setting('app.owner_id')::uuid where user_id = '00000000-0000-0000-0000-000000000000';

-- STEP 3 (strict policies): drop EVERY existing policy on each table (names vary in the
-- live schema — see header), enable RLS, then add one strict auth.uid()-only policy.
do $$
declare tbl text; pol record;
begin
  foreach tbl in array array[
    'contacts','contact_connections','tasks','projects','notes',
    'focus_sessions','neural_chats','user_vector_stores','sprints','calendar_events'
  ] loop
    for pol in select policyname from pg_policies where schemaname = 'public' and tablename = tbl loop
      execute format('drop policy if exists %I on public.%I;', pol.policyname, tbl);
    end loop;
    execute format('alter table public.%I enable row level security;', tbl);
    execute format($f$create policy "owner_all_%1$s" on public.%1$I
        for all using (auth.uid() = user_id) with check (auth.uid() = user_id);$f$, tbl);
  end loop;
end $$;

-- subtasks: no user_id column — scope through parent task ownership. Drop all first.
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'subtasks' loop
    execute format('drop policy if exists %I on public.subtasks;', pol.policyname);
  end loop;
end $$;
alter table public.subtasks enable row level security;
create policy "owner_all_subtasks" on public.subtasks for all
  using (exists (select 1 from public.tasks t where t.id = subtasks.task_id and t.user_id = auth.uid()))
  with check (exists (select 1 from public.tasks t where t.id = subtasks.task_id and t.user_id = auth.uid()));

-- profiles: not backdoored (already scoped to auth.uid()=id) — only add the missing
-- WITH CHECK on UPDATE. Leave the SELECT/INSERT policies intact. Enable RLS explicitly
-- (don't rely on it having stayed enabled since schema.sql).
alter table public.profiles enable row level security;
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- STEP 4: documents (Second Brain corpus) — currently RLS-DISABLED and ownerless.
-- Add owner, backfill, make NOT NULL, enable RLS, add strict policy.
alter table public.documents add column if not exists user_id uuid references auth.users(id) on delete cascade;
update public.documents set user_id = current_setting('app.owner_id')::uuid where user_id is null;
alter table public.documents alter column user_id set not null;
-- documents currently has RLS DISABLED, so any stray/legacy policy on it is dormant but
-- would activate (and OR-combine) the instant RLS is enabled. Drop EVERY existing policy
-- by enumeration (same rationale as STEP 3) before enabling RLS.
do $$
declare pol record;
begin
  for pol in select policyname from pg_policies where schemaname = 'public' and tablename = 'documents' loop
    execute format('drop policy if exists %I on public.documents;', pol.policyname);
  end loop;
end $$;
alter table public.documents enable row level security;
create policy "owner_all_documents" on public.documents for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- STEP 5: harden match_documents — filter by owner, run as invoker (RLS applies),
-- pin search_path (see header), and revoke anon/public execute.
drop function if exists public.match_documents(vector, double precision, int);
create or replace function public.match_documents(
  query_embedding vector(1536), match_threshold float, match_count int
) returns table (id bigint, content text, metadata jsonb, similarity float)
language sql stable security invoker set search_path = public, extensions
as $$
  select d.id, d.content, d.metadata, 1 - (d.embedding <=> query_embedding) as similarity
  from public.documents d
  where d.user_id = auth.uid()
    and 1 - (d.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;
revoke all on function public.match_documents(vector, double precision, int) from public, anon;
grant execute on function public.match_documents(vector, double precision, int) to authenticated;

-- profiles has no user_id (keyed by id = the auth user id) and the app never reads/writes
-- it (settings live client-side), so remove the demo profile explicitly rather than letting
-- STEP 6's ON DELETE CASCADE delete it blind. No-op if none exists.
delete from public.profiles where id = '00000000-0000-0000-0000-000000000000';

-- STEP 6: remove the seeded demo principal (after backfill, so nothing cascades away).
delete from auth.users where id = '00000000-0000-0000-0000-000000000000';

-- Review _nil_counts output above, then:
commit;
