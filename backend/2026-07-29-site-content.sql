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
