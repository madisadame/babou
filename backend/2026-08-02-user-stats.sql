-- Statistiques d'audience pour l'admin : total inscrits, nouveaux ce mois,
-- accès offerts, et inscriptions par mois (pour le graphique d'évolution).
-- SECURITY DEFINER (lit auth.users) + gardé par is_admin().
create or replace function public.admin_user_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare result jsonb;
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  select jsonb_build_object(
    'totalUsers',   (select count(*) from auth.users),
    'newThisMonth', (select count(*) from auth.users where created_at >= date_trunc('month', now())),
    'grantedAccess',(select count(*) from public.user_access where manual_override),
    'monthly', (
      select coalesce(jsonb_agg(jsonb_build_object('month', m, 'count', c) order by m), '[]'::jsonb)
      from (
        select to_char(date_trunc('month', created_at), 'YYYY-MM') as m, count(*)::int as c
        from auth.users
        group by date_trunc('month', created_at)
      ) s
    )
  ) into result;
  return result;
end;
$$;

grant execute on function public.admin_user_stats() to authenticated;

notify pgrst, 'reload schema';
