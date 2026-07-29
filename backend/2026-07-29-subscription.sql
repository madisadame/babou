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
