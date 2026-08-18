-- Esegui questo script nell'SQL Editor del tuo progetto Supabase.

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  role text not null,
  status text not null default 'inviata'
    check (status in ('inviata', 'colloquio', 'offerta', 'rifiutata')),
  match_score int check (match_score >= 0 and match_score <= 100),
  notes text not null default '',
  created_at timestamptz not null default now()
);

alter table public.applications enable row level security;

create policy "Users can view their own applications"
  on public.applications for select
  using (auth.uid() = user_id);

create policy "Users can insert their own applications"
  on public.applications for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own applications"
  on public.applications for update
  using (auth.uid() = user_id);

create policy "Users can delete their own applications"
  on public.applications for delete
  using (auth.uid() = user_id);

create index if not exists applications_user_id_idx on public.applications (user_id);
