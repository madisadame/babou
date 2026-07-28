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

-- Lecture publique conditionnée : les brouillons (published = false) ne sont
-- visibles que des admins (voir aussi 2026-07-29-draft-publish.sql).
drop policy if exists "public read books" on public.books;
create policy "public read books" on public.books
  for select using (published = true or public.is_admin());

drop policy if exists "public read chapters" on public.chapters;
create policy "public read chapters" on public.chapters
  for select using (published = true or public.is_admin());
-- Gestion multi-administrateurs : fonctions RPC appelées depuis l'app.
-- SECURITY DEFINER (pour lire auth.users) mais protégées par public.is_admin().

-- Lister les administrateurs avec leur e-mail.
create or replace function public.list_admins()
returns table(user_id uuid, email text)
language sql
security definer
set search_path = public
as $$
  select a.user_id, u.email::text
  from public.admins a
  join auth.users u on u.id = a.user_id
  where public.is_admin()
  order by a.created_at;
$$;

-- Ajouter un admin par e-mail. Retourne 'ok' | 'not_found' | 'forbidden'.
create or replace function public.add_admin_by_email(target_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare uid uuid;
begin
  if not public.is_admin() then return 'forbidden'; end if;
  select id into uid from auth.users where lower(email) = lower(trim(target_email)) limit 1;
  if uid is null then return 'not_found'; end if;
  insert into public.admins(user_id) values (uid) on conflict do nothing;
  return 'ok';
end;
$$;

-- Retirer un admin. Retourne 'ok' | 'forbidden'.
create or replace function public.remove_admin(target uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then return 'forbidden'; end if;
  delete from public.admins where user_id = target;
  return 'ok';
end;
$$;

grant execute on function public.list_admins() to authenticated;
grant execute on function public.add_admin_by_email(text) to authenticated;
grant execute on function public.remove_admin(uuid) to authenticated;

