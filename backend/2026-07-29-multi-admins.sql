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
