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

-- Statistiques de contenu pour l'admin : agrège la progression de lecture de
-- TOUS les utilisateurs par chapitre. SECURITY DEFINER (contourne la RLS de
-- reading_progress) mais réservé aux admins via public.is_admin().
create or replace function public.content_stats()
returns table(
  chapter_id text,
  chapter_title text,
  book_title text,
  readers bigint,
  completed bigint,
  avg_progress real
)
language sql
security definer
set search_path = public
as $$
  select c.id, c.title, b.title,
    count(rp.user_id),
    count(rp.user_id) filter (where rp.progress >= 0.9),
    coalesce(avg(rp.progress), 0)::real
  from public.chapters c
  join public.books b on b.id = c.book_id
  left join public.reading_progress rp on rp.chapter_id = c.id
  where public.is_admin()
  group by c.id, c.title, b.title, c.position, b.position
  order by b.position, c.position;
$$;

grant execute on function public.content_stats() to authenticated;

-- Contenu éditable du site (textes gérés depuis l'admin, ex. page d'accueil).
-- Lecture publique ; écriture réservée aux admins.
create table if not exists public.site_content (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

drop policy if exists "public read site_content" on public.site_content;
create policy "public read site_content" on public.site_content
  for select using (true);

drop policy if exists "admin write site_content" on public.site_content;
create policy "admin write site_content" on public.site_content
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Suppression de compte par l'utilisateur lui-même (exigence Apple).
-- SECURITY DEFINER : supprime la ligne dans auth.users, ce qui efface en
-- cascade toutes les données liées (reading_progress, quiz_results,
-- user_state, admins — toutes en ON DELETE CASCADE).
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

grant execute on function public.delete_own_account() to authenticated;

-- ============================================================
-- Abonnement + accès (activation par l'admin après lancement)
-- ============================================================

-- Config globale de l'app (une seule ligne, id=1).
create table if not exists public.app_config (
  id smallint primary key default 1,
  subscription_enabled boolean not null default false,
  subscription_activated_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint app_config_single check (id = 1)
);
insert into public.app_config (id) values (1) on conflict (id) do nothing;

alter table public.app_config enable row level security;
-- Lecture publique : l'app doit connaître l'état d'abonnement pour tous.
drop policy if exists app_config_read on public.app_config;
create policy app_config_read on public.app_config for select using (true);
-- Écriture : admins uniquement.
drop policy if exists app_config_write on public.app_config;
create policy app_config_write on public.app_config for all
  using (public.is_admin()) with check (public.is_admin());

-- Accès offert manuellement par un admin (déblocage d'une personne).
create table if not exists public.user_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  manual_override boolean not null default false,
  override_note text,
  updated_at timestamptz not null default now()
);
alter table public.user_access enable row level security;
-- Chacun lit son propre accès ; les admins lisent tout.
drop policy if exists user_access_self on public.user_access;
create policy user_access_self on public.user_access for select
  using (auth.uid() = user_id or public.is_admin());
-- Écriture : admins uniquement.
drop policy if exists user_access_admin_write on public.user_access;
create policy user_access_admin_write on public.user_access for all
  using (public.is_admin()) with check (public.is_admin());

-- Active / désactive l'abonnement pour toute l'app.
-- La date d'activation est posée une seule fois (démarre la semaine de grâce).
create or replace function public.set_subscription_enabled(enabled boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  update public.app_config
     set subscription_enabled = enabled,
         subscription_activated_at = case
           when enabled then coalesce(subscription_activated_at, now())
           else subscription_activated_at
         end,
         updated_at = now()
   where id = 1;
end; $$;
grant execute on function public.set_subscription_enabled(boolean) to authenticated;

-- Débloque / rebloque une personne (accès offert).
create or replace function public.set_user_access(target uuid, value boolean, note text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  insert into public.user_access (user_id, manual_override, override_note, updated_at)
  values (target, value, note, now())
  on conflict (user_id) do update
    set manual_override = excluded.manual_override,
        override_note = excluded.override_note,
        updated_at = now();
end; $$;
grant execute on function public.set_user_access(uuid, boolean, text) to authenticated;

-- Recherche d'un utilisateur par e-mail (pour lui offrir l'accès).
create or replace function public.admin_find_user(email_query text)
returns table (user_id uuid, email text, created_at timestamptz, has_access boolean)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  return query
    select u.id, u.email::text, u.created_at, coalesce(a.manual_override, false)
    from auth.users u
    left join public.user_access a on a.user_id = u.id
    where u.email ilike '%' || email_query || '%'
    order by u.created_at desc
    limit 20;
end; $$;
grant execute on function public.admin_find_user(text) to authenticated;

