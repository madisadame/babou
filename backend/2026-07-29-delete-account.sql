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
