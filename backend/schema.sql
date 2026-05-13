-- Run this in your Supabase SQL editor

-- Documents table
create table documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  filename text not null,
  storage_path text not null,
  extracted_text text,
  summary text,
  word_count int default 0,
  status text default 'ready',  -- ready | generating | streaming | audio_ready | error
  ready_chunks int default 0,
  total_chunks int default 0,
  audio_voice text,
  audio_engine text,
  podcast_status text, -- none | generating | ready
  podcast_ready int default 0,
  podcast_total int default 0,
  podcast_script jsonb,
  created_at timestamptz default now()
);

-- Audio tracks table
create table audio_tracks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  storage_path text not null,
  duration_seconds int,
  created_at timestamptz default now()
);

-- Activity table (listens, downloads, etc.)
create table activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  doc_id uuid references documents(id) on delete cascade not null,
  type text not null,
  duration int default 0,
  created_at timestamptz default now()
);

-- Notebook workspace tables
create table notebooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table sources (
  id uuid primary key default gen_random_uuid(),
  notebook_id uuid references notebooks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null,
  title text not null,
  url text,
  document_id uuid references documents(id) on delete cascade,
  content text default '',
  fulltext text default '',
  metadata jsonb default '{}'::jsonb,
  status text default 'ready',
  refresh_state text default 'fresh',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table notes (
  id uuid primary key default gen_random_uuid(),
  notebook_id uuid references notebooks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  source_id uuid references sources(id) on delete set null,
  kind text default 'note',
  title text not null,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table artifacts (
  id uuid primary key default gen_random_uuid(),
  notebook_id uuid references notebooks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null,
  title text not null,
  content text not null,
  format text default 'markdown',
  status text default 'ready',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table notebook_sharing (
  notebook_id uuid primary key references notebooks(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade not null,
  public boolean default false,
  role text default 'viewer',
  updated_at timestamptz default now()
);

create table research_jobs (
  id uuid primary key default gen_random_uuid(),
  notebook_id uuid references notebooks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  query text not null,
  mode text default 'fast',
  status text default 'ready',
  results jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row Level Security — users can only see their own data
alter table documents enable row level security;
alter table audio_tracks enable row level security;
alter table activity enable row level security;
alter table notebooks enable row level security;
alter table sources enable row level security;
alter table notes enable row level security;
alter table artifacts enable row level security;
alter table notebook_sharing enable row level security;
alter table research_jobs enable row level security;

create policy "Users can manage own documents"
  on documents for all
  using (auth.uid() = user_id);

create policy "Users can manage own audio"
  on audio_tracks for all
  using (auth.uid() = user_id);

create policy "Users can manage own activity"
  on activity for all
  using (auth.uid() = user_id);

create policy "Users can manage own notebooks"
  on notebooks for all
  using (auth.uid() = user_id);

create policy "Users can manage own sources"
  on sources for all
  using (auth.uid() = user_id);

create policy "Users can manage own notes"
  on notes for all
  using (auth.uid() = user_id);

create policy "Users can manage own artifacts"
  on artifacts for all
  using (auth.uid() = user_id);

create policy "Users can manage own sharing settings"
  on notebook_sharing for all
  using (auth.uid() = user_id);

create policy "Users can manage own research jobs"
  on research_jobs for all
  using (auth.uid() = user_id);

-- Storage buckets (create these in Supabase dashboard Storage tab)
-- Bucket name: documents  (private)
-- Bucket name: audio      (private)
