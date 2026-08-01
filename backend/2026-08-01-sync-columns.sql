-- Garantit toutes les colonnes récentes (idempotent) + recharge le cache
-- PostgREST. À lancer si « Could not find the '…' column … in the schema cache ».

alter table public.books    add column if not exists published boolean not null default true;
alter table public.chapters add column if not exists published boolean not null default true;
alter table public.chapters add column if not exists audio_url text;

alter table public.chapter_segments add column if not exists explanation_fr text;
alter table public.chapter_segments add column if not exists explanation_shimaore text;
alter table public.chapter_segments add column if not exists explanation_audio_fr text;
alter table public.chapter_segments add column if not exists explanation_audio_shimaore text;

notify pgrst, 'reload schema';
