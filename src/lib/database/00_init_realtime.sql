-- Create table for realtime submission updates
create table if not exists public.submission_status_updates (
  id uuid default gen_random_uuid() primary key,
  submission_id text not null,
  user_id uuid references auth.users(id),
  status text not null, -- 'queued', 'processing', 'completed', 'error'
  message text,
  progress integer default 0,
  payload jsonb,
  created_at timestamptz default now()
);

-- Enable Realtime for this table
alter publication supabase_realtime add table public.submission_status_updates;

-- Create RLS policies
alter table public.submission_status_updates enable row level security;

-- Allow users to view their own updates
create policy "Users can view their own submission updates"
on public.submission_status_updates for select
using (auth.uid() = user_id);

-- Allow public access for anonymous submissions (optional, if you support anon usage)
-- create policy "Allow public read access"
-- on public.submission_status_updates for select
-- using (true);
