-- État utilisateur générique : une valeur JSON par (utilisateur, clé).
-- Synchronise les données locales entre appareils : marque-pages, série &
-- objectif, révision espacée, quiz final, préférences, dernière lecture.
create table if not exists public.user_state (
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  value jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.user_state enable row level security;

-- Chaque utilisateur ne lit et n'écrit que ses propres lignes.
create policy "user_state_select_own" on public.user_state
  for select using (auth.uid() = user_id);
create policy "user_state_insert_own" on public.user_state
  for insert with check (auth.uid() = user_id);
create policy "user_state_update_own" on public.user_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_state_delete_own" on public.user_state
  for delete using (auth.uid() = user_id);
