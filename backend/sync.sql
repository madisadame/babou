-- Tables de synchronisation par utilisateur (progression + résultats de quiz).
-- À exécuter dans le SQL Editor de Supabase, APRÈS avoir activé l'auth.
-- RLS : chaque utilisateur ne voit et ne modifie que ses propres lignes.

-- Progression de lecture (une ligne par utilisateur + chapitre)
create table if not exists public.reading_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  chapter_id text not null,
  progress real not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, chapter_id)
);

alter table public.reading_progress enable row level security;
drop policy if exists "own reading_progress" on public.reading_progress;
create policy "own reading_progress" on public.reading_progress
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Résultats de quiz (une ligne par utilisateur + chapitre)
create table if not exists public.quiz_results (
  user_id uuid not null references auth.users(id) on delete cascade,
  chapter_id text not null,
  total int not null default 0,
  correct int not null default 0,
  attempts int not null default 0,
  status jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, chapter_id)
);

alter table public.quiz_results enable row level security;
drop policy if exists "own quiz_results" on public.quiz_results;
create policy "own quiz_results" on public.quiz_results
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
