-- Garantit les colonnes brouillon/publié et force PostgREST à recharger son
-- cache de schéma (corrige « Could not find the 'published' column ... »).
alter table public.books add column if not exists published boolean not null default true;
alter table public.chapters add column if not exists published boolean not null default true;

notify pgrst, 'reload schema';
