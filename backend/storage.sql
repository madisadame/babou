-- Bucket de médias (couvertures, audios) + politiques d'accès.
-- Lecture publique (les fichiers sont servis via URL publique) ; écriture
-- réservée aux admins. À exécuter dans le SQL Editor de Supabase.

-- Bucket public
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

-- Politiques sur storage.objects pour le bucket « media »
drop policy if exists "public read media" on storage.objects;
create policy "public read media" on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists "admin insert media" on storage.objects;
create policy "admin insert media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "admin update media" on storage.objects;
create policy "admin update media" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "admin delete media" on storage.objects;
create policy "admin delete media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());
