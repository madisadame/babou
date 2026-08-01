-- Ajoute l'audio de l'explication (français + shimaoré) aux segments de leçon.
alter table public.chapter_segments
  add column if not exists explanation_audio_fr text,
  add column if not exists explanation_audio_shimaore text;
