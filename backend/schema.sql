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
  status text default 'ready',  -- ready | generating | audio_ready | error
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

-- Row Level Security — users can only see their own data
alter table documents enable row level security;
alter table audio_tracks enable row level security;

create policy "Users can manage own documents"
  on documents for all
  using (auth.uid() = user_id);

create policy "Users can manage own audio"
  on audio_tracks for all
  using (auth.uid() = user_id);

-- Storage buckets (create these in Supabase dashboard Storage tab)
-- Bucket name: documents  (private)
-- Bucket name: audio      (private)
