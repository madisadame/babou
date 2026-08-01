-- Ajoute un champ « explication » (français + shimaoré) à chaque segment de
-- leçon, pour donner une explication libre sans texte arabe/traduction.
alter table public.chapter_segments
  add column if not exists explanation_fr text,
  add column if not exists explanation_shimaore text;
