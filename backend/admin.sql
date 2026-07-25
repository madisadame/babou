-- Rôle admin + politiques d'écriture pour l'interface d'administration.
-- La lecture du contenu reste publique ; l'écriture est réservée aux admins.

-- Table des administrateurs
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;
drop policy if exists "read own admin row" on public.admins;
create policy "read own admin row" on public.admins
  for select using (auth.uid() = user_id);

-- L'utilisateur courant est-il admin ? (security definer : contourne la RLS
-- de la table admins pour la vérification)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- Politiques d'écriture (les politiques de lecture publique existent déjà).
drop policy if exists "admin write books" on public.books;
create policy "admin write books" on public.books
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin write chapters" on public.chapters;
create policy "admin write chapters" on public.chapters
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin write chapter_segments" on public.chapter_segments;
create policy "admin write chapter_segments" on public.chapter_segments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin write questions" on public.questions;
create policy "admin write questions" on public.questions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin write question_choices" on public.question_choices;
create policy "admin write question_choices" on public.question_choices
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ⚠️ Te désigner comme admin : décommente et mets l'email de TON compte
-- (celui utilisé pour te connecter dans l'app), puis exécute :
-- insert into public.admins (user_id)
--   select id from auth.users where email = 'ton-email@exemple.com'
--   on conflict do nothing;
