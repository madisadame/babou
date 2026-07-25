import { supabase } from './client';

// Écritures d'administration (réservées aux admins par la RLS). Séparées du
// content-repository (lecture) : seul le back Supabase les implémente.

type Result = { error: string | null };

export type BookInput = {
  title: string;
  description: string;
  category: string;
  coverUrl: string;
  position: number;
};

export type ChapterInput = {
  bookId: string;
  title: string;
  description: string;
  position: number;
};

// Génère un identifiant lisible et unique à partir d'un titre.
function slugify(text: string): string {
  const stripped = [...text.normalize('NFD')]
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return code < 0x0300 || code > 0x036f;
    })
    .join('');
  const slug = stripped
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return slug || 'item';
}

function generateId(text: string): string {
  return `${slugify(text)}-${Math.random().toString(36).slice(2, 7)}`;
}

function toError(error: { message: string } | null): Result {
  return { error: error ? error.message : null };
}

// ---- Livres ----

export async function createBook(input: BookInput): Promise<Result> {
  if (!supabase) return { error: 'unavailable' };
  const { error } = await supabase.from('books').insert({
    id: generateId(input.title),
    title: input.title,
    description: input.description,
    category: input.category,
    cover_url: input.coverUrl || null,
    position: input.position,
  });
  return toError(error);
}

export async function updateBook(id: string, input: BookInput): Promise<Result> {
  if (!supabase) return { error: 'unavailable' };
  const { error } = await supabase
    .from('books')
    .update({
      title: input.title,
      description: input.description,
      category: input.category,
      cover_url: input.coverUrl || null,
      position: input.position,
    })
    .eq('id', id);
  return toError(error);
}

export async function deleteBook(id: string): Promise<Result> {
  if (!supabase) return { error: 'unavailable' };
  const { error } = await supabase.from('books').delete().eq('id', id);
  return toError(error);
}

// ---- Chapitres ----

export async function createChapter(input: ChapterInput): Promise<Result> {
  if (!supabase) return { error: 'unavailable' };
  const { error } = await supabase.from('chapters').insert({
    id: generateId(input.title),
    book_id: input.bookId,
    title: input.title,
    description: input.description,
    position: input.position,
  });
  return toError(error);
}

export async function updateChapter(id: string, input: ChapterInput): Promise<Result> {
  if (!supabase) return { error: 'unavailable' };
  const { error } = await supabase
    .from('chapters')
    .update({
      title: input.title,
      description: input.description,
      position: input.position,
    })
    .eq('id', id);
  return toError(error);
}

export async function deleteChapter(id: string): Promise<Result> {
  if (!supabase) return { error: 'unavailable' };
  const { error } = await supabase.from('chapters').delete().eq('id', id);
  return toError(error);
}
