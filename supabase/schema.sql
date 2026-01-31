-- Ensure default user exists for demo purposes
INSERT INTO auth.users (id, email)
VALUES ('00000000-0000-0000-0000-000000000000', 'demo@example.com')
ON CONFLICT (id) DO NOTHING;

-- Profiles table to store user settings
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  background TEXT,
  font TEXT DEFAULT 'var(--font-geist-sans)',
  widgets JSONB DEFAULT '["clock", "focus"]'::jsonb,
  glass_opacity INTEGER DEFAULT 20,
  glass_blur INTEGER DEFAULT 16,
  theme TEXT DEFAULT 'glass',
  primary_color TEXT DEFAULT '#ffffff',
  theme_mode TEXT DEFAULT 'dark',
  recent_backgrounds TEXT[] DEFAULT '{}'::text[]
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#ffffff',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Allow access to demo user ('0000...') for development
DROP POLICY IF EXISTS "Enable all for projects" ON public.projects;
DROP POLICY IF EXISTS "Users can see own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;

CREATE POLICY "Enable all for projects" ON public.projects
  FOR ALL USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

-- Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  urgency TEXT DEFAULT 'medium',
  importance TEXT DEFAULT 'medium',
  time_spent INTEGER DEFAULT 0, -- in minutes
  due_date TIMESTAMP WITH TIME ZONE,
  custom_fields JSONB DEFAULT '[]'::jsonb,
  project_id UUID REFERENCES public.projects(id)
);

-- Ensure columns exist (migration for existing tables)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'medium';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS importance TEXT DEFAULT 'medium';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS time_spent INTEGER DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS timer_started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can manage own tasks" ON public.tasks;

CREATE POLICY "Enable all for tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

-- Subtasks table
CREATE TABLE IF NOT EXISTS public.subtasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false
);

ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for subtasks" ON public.subtasks;
DROP POLICY IF EXISTS "Users can manage subtasks of own tasks" ON public.subtasks;

CREATE POLICY "Enable all for subtasks" ON public.subtasks 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE tasks.id = subtasks.task_id 
    AND (tasks.user_id = auth.uid() OR tasks.user_id = '00000000-0000-0000-0000-000000000000')
  )
);

-- Contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  avatar_color TEXT,
  status TEXT DEFAULT 'New',
  company TEXT,
  role TEXT,
  phone TEXT,
  last_talked TIMESTAMP WITH TIME ZONE,
  last_interaction_summary TEXT, -- Notes from last chat
  frequency INTEGER DEFAULT 30, -- Days between contacts
  tags TEXT[] DEFAULT '{}'::text[],
  custom_fields JSONB DEFAULT '[]'::jsonb
);

-- Ensure columns exist (migration for existing tables)
-- Core fields
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'New';
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users ON DELETE CASCADE;

-- Metadata fields
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS last_talked TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS last_interaction_summary TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS frequency INTEGER DEFAULT 30;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS avatar_color TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::text[];
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Reload Supabase Schema Cache
NOTIFY pgrst, 'reload config';

CREATE TABLE IF NOT EXISTS public.contact_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  contact_a UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  contact_b UUID REFERENCES public.contacts(id) ON DELETE CASCADE NOT NULL,
  connection_type TEXT DEFAULT 'direct',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(contact_a, contact_b)
);

ALTER TABLE public.contact_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for connections" ON public.contact_connections;
DROP POLICY IF EXISTS "Users can manage own contact connections" ON public.contact_connections;

CREATE POLICY "Enable all for connections" ON public.contact_connections FOR ALL USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for contacts" ON public.contacts;
DROP POLICY IF EXISTS "Users can manage own contacts" ON public.contacts;

CREATE POLICY "Enable all for contacts" ON public.contacts FOR ALL USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

-- Documents for Vector Search (already partially handled by ingest route, but here for completeness)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.documents (
  id BIGSERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB,
  embedding VECTOR(1536)
);

-- Vector similarity search function
DROP FUNCTION IF EXISTS match_documents(vector, double precision, int);

CREATE OR REPLACE FUNCTION match_documents (
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id BIGINT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
 WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
-- Notes table for scratchpad
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  content TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own notes" ON public.notes;
CREATE POLICY "Users can manage own notes" ON public.notes FOR ALL USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

-- Focus sessions table
CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  duration INTEGER NOT NULL, -- in seconds
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own focus sessions" ON public.focus_sessions;
CREATE POLICY "Users can manage own focus sessions" ON public.focus_sessions FOR ALL USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

-- Neural chats table for memory persistence
CREATE TABLE IF NOT EXISTS public.neural_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT DEFAULT 'Untitled Transmission',
  messages JSONB DEFAULT '[]'::jsonb,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.neural_chats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own neural chats" ON public.neural_chats;
CREATE POLICY "Users can manage own neural chats" ON public.neural_chats FOR ALL USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

-- User-linked Vector Stores
CREATE TABLE IF NOT EXISTS public.user_vector_stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  vector_store_id TEXT NOT NULL, -- The OpenAI vector store ID (vs_...)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, vector_store_id)
);

ALTER TABLE public.user_vector_stores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own vector stores" ON public.user_vector_stores;
CREATE POLICY "Users can manage own vector stores" ON public.user_vector_stores FOR ALL USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

-- Sprints table for time-bound task tracking
CREATE TABLE IF NOT EXISTS public.sprints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  goal TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'planning', -- planning, active, completed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own sprints" ON public.sprints;
CREATE POLICY "Users can manage own sprints" ON public.sprints FOR ALL USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

-- Add sprint_id column to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS sprint_id UUID REFERENCES public.sprints(id) ON DELETE SET NULL;

-- Calendar events table
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own events" ON public.calendar_events;
CREATE POLICY "Users can manage own events" ON public.calendar_events FOR ALL USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');
