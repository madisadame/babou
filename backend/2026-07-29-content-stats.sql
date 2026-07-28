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
