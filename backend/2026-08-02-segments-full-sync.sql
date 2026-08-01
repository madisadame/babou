-- Ajoute TOUTES les colonnes de chapter_segments utilisées par l'app
-- (idempotent) + recharge le cache API. Corrige les erreurs
-- « Could not find the '…' column of 'chapter_segments' in the schema cache ».
alter table public.chapter_segments add column if not exists translation_fr text;
alter table public.chapter_segments add column if not exists translation_shimaore text;
alter table public.chapter_segments add column if not exists audio_url text;
alter table public.chapter_segments add column if not exists translation_audio_fr text;
alter table public.chapter_segments add column if not exists translation_audio_shimaore text;
alter table public.chapter_segments add column if not exists explanation_fr text;
alter table public.chapter_segments add column if not exists explanation_shimaore text;
alter table public.chapter_segments add column if not exists explanation_audio_fr text;
alter table public.chapter_segments add column if not exists explanation_audio_shimaore text;
alter table public.chapter_segments add column if not exists words jsonb;

notify pgrst, 'reload schema';
