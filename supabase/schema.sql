-- =============================================================
-- schema.sql — SECURE bootstrap for a FRESH Supabase project.
--
-- Run this in the Supabase SQL editor on a new project. It is idempotent (safe to
-- re-run) and creates every table with STRICT per-owner RLS from the start:
--   * every row is scoped to its owner via  USING (auth.uid() = user_id)
--     WITH CHECK (auth.uid() = user_id)  — reads AND writes are gated.
--   * the `documents` corpus has an owner column + RLS.
--   * match_documents is SECURITY INVOKER, owner-filtered, search_path-pinned,
--     and EXECUTE is revoked from anon/public.
-- There is NO demo/seed principal and NO nil-UUID backdoor. With only the public
-- anon key, auth.uid() is null, so every table returns zero rows and the RPC is
-- not executable.
--
-- Prereq: create your login user first (Supabase Auth -> Users -> Add user, using
-- your ALLOWED_EMAIL). All tables start empty; rows you create are scoped to your
-- auth.uid() automatically.
-- =============================================================

-- pgvector (for documents.embedding + match_documents).
create extension if not exists vector;

-- ---------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default timezone('utc', now()) not null,
  name text not null,
  color text default '#ffffff',
  user_id uuid not null references auth.users(id) on delete cascade
);
alter table public.projects enable row level security;
drop policy if exists "owner_all_projects" on public.projects;
create policy "owner_all_projects" on public.projects for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users on delete cascade,
  created_at timestamptz default timezone('utc', now()) not null,
  title text not null,
  description text,
  status text default 'todo',
  priority text default 'medium',
  urgency text default 'medium',
  importance text default 'medium',
  time_spent integer default 0,               -- minutes
  timer_started_at timestamptz default null,
  due_date timestamptz,
  custom_fields jsonb default '[]'::jsonb,
  project_id uuid references public.projects(id)
);
alter table public.tasks enable row level security;
drop policy if exists "owner_all_tasks" on public.tasks;
create policy "owner_all_tasks" on public.tasks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- subtasks — no user_id; ownership flows through the parent task.
-- ---------------------------------------------------------------
create table if not exists public.subtasks (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.tasks on delete cascade not null,
  title text not null,
  completed boolean default false
);
alter table public.subtasks enable row level security;
drop policy if exists "owner_all_subtasks" on public.subtasks;
create policy "owner_all_subtasks" on public.subtasks for all
  using (exists (select 1 from public.tasks t where t.id = subtasks.task_id and t.user_id = auth.uid()))
  with check (exists (select 1 from public.tasks t where t.id = subtasks.task_id and t.user_id = auth.uid()));

-- ---------------------------------------------------------------
-- contacts
-- ---------------------------------------------------------------
create table if not exists public.contacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users on delete cascade,
  created_at timestamptz default timezone('utc', now()) not null,
  name text not null,
  email text,
  avatar_color text,
  status text default 'New',
  company text,
  role text,
  phone text,
  last_talked timestamptz,
  last_interaction_summary text,
  frequency integer default 30,               -- days between contacts
  tags text[] default '{}'::text[],
  custom_fields jsonb default '[]'::jsonb,
  nickname text
);
alter table public.contacts enable row level security;
drop policy if exists "owner_all_contacts" on public.contacts;
create policy "owner_all_contacts" on public.contacts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- contact_connections
-- ---------------------------------------------------------------
create table if not exists public.contact_connections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users on delete cascade,
  contact_a uuid references public.contacts(id) on delete cascade not null,
  contact_b uuid references public.contacts(id) on delete cascade not null,
  connection_type text default 'direct',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default timezone('utc', now()) not null,
  unique(contact_a, contact_b)
);
alter table public.contact_connections enable row level security;
drop policy if exists "owner_all_contact_connections" on public.contact_connections;
create policy "owner_all_contact_connections" on public.contact_connections for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- documents — Second Brain corpus. Owned + RLS from creation.
-- ---------------------------------------------------------------
create table if not exists public.documents (
  id bigserial primary key,
  content text not null,
  metadata jsonb,
  embedding vector(1536),
  user_id uuid not null references auth.users(id) on delete cascade
);
alter table public.documents enable row level security;
drop policy if exists "owner_all_documents" on public.documents;
create policy "owner_all_documents" on public.documents for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- match_documents — owner-filtered similarity search. SECURITY INVOKER so RLS
-- applies as the caller; search_path pinned to trusted schemas (pgvector's `<=>`
-- lives in public/extensions); EXECUTE revoked from anon/public.
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

-- ---------------------------------------------------------------
-- user_vector_stores — maps the owner to their OpenAI vector store ids.
-- ---------------------------------------------------------------
create table if not exists public.user_vector_stores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users on delete cascade,
  vector_store_id text not null,              -- OpenAI vector store id (vs_...)
  created_at timestamptz default timezone('utc', now()) not null,
  unique(user_id, vector_store_id)
);
alter table public.user_vector_stores enable row level security;
drop policy if exists "owner_all_user_vector_stores" on public.user_vector_stores;
create policy "owner_all_user_vector_stores" on public.user_vector_stores for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- sprints
-- ---------------------------------------------------------------
create table if not exists public.sprints (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  goal text,
  start_date timestamptz not null,
  end_date timestamptz not null,
  status text default 'planning',             -- planning, active, completed
  created_at timestamptz default timezone('utc', now()) not null
);
alter table public.sprints enable row level security;
drop policy if exists "owner_all_sprints" on public.sprints;
create policy "owner_all_sprints" on public.sprints for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- tasks.sprint_id (added after sprints exists).
alter table public.tasks add column if not exists sprint_id uuid references public.sprints(id) on delete set null;

-- ---------------------------------------------------------------
-- app_state — per-user, per-app JSONB state blob (lifeCRM, execCoach).
-- ---------------------------------------------------------------
create table if not exists public.app_state (
  user_id    uuid not null references auth.users(id) on delete cascade,
  app        text not null check (app in ('lifeCRM','execCoach','home','brain')),
  data       jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (user_id, app)
);
alter table public.app_state enable row level security;
drop policy if exists "state_select" on public.app_state;
create policy "state_select" on public.app_state for select using (auth.uid() = user_id);
drop policy if exists "state_insert" on public.app_state;
create policy "state_insert" on public.app_state for insert with check (auth.uid() = user_id);
drop policy if exists "state_update" on public.app_state;
create policy "state_update" on public.app_state for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "state_delete" on public.app_state;
create policy "state_delete" on public.app_state for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- google_tokens — encrypted Google OAuth refresh token at rest.
-- ---------------------------------------------------------------
create table if not exists public.google_tokens (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  enc_refresh   text not null,   -- AES-GCM ciphertext (never plaintext, never to client)
  scope         text,
  updated_at    timestamptz not null default now()
);
alter table public.google_tokens enable row level security;
drop policy if exists "gt_owner" on public.google_tokens;
create policy "gt_owner" on public.google_tokens for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
