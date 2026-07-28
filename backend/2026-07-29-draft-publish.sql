-- Brouillon / publication : un livre ou chapitre en brouillon n'est visible
-- que des administrateurs ; le public ne voit que le contenu publié.
-- (Nécessite la fonction public.is_admin() déjà créée dans admin.sql.)
alter table public.books add column if not exists published boolean not null default true;
alter table public.chapters add column if not exists published boolean not null default true;

-- Remplace les politiques de lecture publique par une visibilité conditionnelle.
drop policy if exists "public read books" on public.books;
create policy "public read books" on public.books
  for select using (published = true or public.is_admin());

drop policy if exists "public read chapters" on public.chapters;
create policy "public read chapters" on public.chapters
  for select using (published = true or public.is_admin());
