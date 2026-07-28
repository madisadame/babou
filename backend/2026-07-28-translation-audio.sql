-- Ajoute l'audio de traduction (par langue) aux segments de leçon,
-- pour la lecture en paire : récitation (arabe) + traduction (fr / shimaoré).
alter table public.chapter_segments
  add column if not exists translation_audio_fr text,
  add column if not exists translation_audio_shimaore text;
