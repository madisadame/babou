-- Schéma Babou (Supabase / PostgreSQL)
-- Hiérarchie : books -> chapters -> chapter_segments (leçon)
-- À exécuter dans l'éditeur SQL de Supabase (une fois). Idempotent.

-- Livres
create table if not exists public.books (
  id text primary key,
  title text not null,
  description text not null default '',
  category text not null default '',
  cover_url text,
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- Chapitres (appartiennent à un livre)
create table if not exists public.chapters (
  id text primary key,
  book_id text not null references public.books(id) on delete cascade,
  position int not null default 0,
  title text not null,
  description text not null default '',
  audio_url text,
  created_at timestamptz not null default now()
);
create index if not exists chapters_book_id_idx on public.chapters(book_id);

-- Segments de leçon : texte arabe + traductions + (à terme) audio et timings
create table if not exists public.chapter_segments (
  id text primary key,
  chapter_id text not null references public.chapters(id) on delete cascade,
  position int not null default 0,
  arabic text not null default '',
  translation_fr text,
  translation_shimaore text,
  audio_url text,
  words jsonb,
  created_at timestamptz not null default now()
);
create index if not exists chapter_segments_chapter_id_idx on public.chapter_segments(chapter_id);

-- Sécurité : lecture publique (clé anon), écriture réservée.
-- L'admin via Supabase Studio utilise le rôle service (bypass RLS).
alter table public.books enable row level security;
alter table public.chapters enable row level security;
alter table public.chapter_segments enable row level security;

drop policy if exists "public read books" on public.books;
drop policy if exists "public read chapters" on public.chapters;
drop policy if exists "public read chapter_segments" on public.chapter_segments;

create policy "public read books" on public.books for select using (true);
create policy "public read chapters" on public.chapters for select using (true);
create policy "public read chapter_segments" on public.chapter_segments for select using (true);
