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

// ---- Segments de leçon ----

export type SegmentInput = {
  chapterId: string;
  position: number;
  arabic: string;
  translationFr: string;
  translationShimaore: string;
  audioUrl: string;
};

export type AdminSegment = SegmentInput & { id: string };

type SegmentRow = {
  id: string;
  chapter_id: string;
  position: number | null;
  arabic: string | null;
  translation_fr: string | null;
  translation_shimaore: string | null;
  audio_url: string | null;
};

function toAdminSegment(row: SegmentRow): AdminSegment {
  return {
    id: row.id,
    chapterId: row.chapter_id,
    position: row.position ?? 0,
    arabic: row.arabic ?? '',
    translationFr: row.translation_fr ?? '',
    translationShimaore: row.translation_shimaore ?? '',
    audioUrl: row.audio_url ?? '',
  };
}

function segmentColumns(input: SegmentInput) {
  return {
    chapter_id: input.chapterId,
    position: input.position,
    arabic: input.arabic,
    translation_fr: input.translationFr || null,
    translation_shimaore: input.translationShimaore || null,
    audio_url: input.audioUrl || null,
  };
}

export async function getSegments(chapterId: string): Promise<AdminSegment[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('chapter_segments')
    .select('*')
    .eq('chapter_id', chapterId)
    .order('position');
  if (error || !data) return [];
  return (data as SegmentRow[]).map(toAdminSegment);
}

export async function getSegment(id: string): Promise<AdminSegment | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('chapter_segments')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return toAdminSegment(data as SegmentRow);
}

export async function createSegment(input: SegmentInput): Promise<Result> {
  if (!supabase) return { error: 'unavailable' };
  const id = `${input.chapterId}-${Math.random().toString(36).slice(2, 7)}`;
  const { error } = await supabase.from('chapter_segments').insert({ id, ...segmentColumns(input) });
  return toError(error);
}

export async function updateSegment(id: string, input: SegmentInput): Promise<Result> {
  if (!supabase) return { error: 'unavailable' };
  const { error } = await supabase
    .from('chapter_segments')
    .update({
      position: input.position,
      arabic: input.arabic,
      translation_fr: input.translationFr || null,
      translation_shimaore: input.translationShimaore || null,
      audio_url: input.audioUrl || null,
    })
    .eq('id', id);
  return toError(error);
}

export async function deleteSegment(id: string): Promise<Result> {
  if (!supabase) return { error: 'unavailable' };
  const { error } = await supabase.from('chapter_segments').delete().eq('id', id);
  return toError(error);
}
