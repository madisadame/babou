import type { Book } from '@/domain/book';
import type { Chapter } from '@/domain/chapter';
import type { Lesson, LessonSegment, LessonWord, Translations } from '@/domain/lesson';
import type { ContentRepository } from '@/data/content-repository';

import { supabase } from './client';

// Lignes telles que renvoyées par Supabase (colonnes snake_case).
type BookRow = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  cover_url: string | null;
  chapters?: { count: number }[];
};

type ChapterRow = {
  id: string;
  book_id: string;
  position: number | null;
  title: string;
  description: string | null;
};

type SegmentRow = {
  id: string;
  position: number | null;
  arabic: string | null;
  translation_fr: string | null;
  translation_shimaore: string | null;
  audio_url: string | null;
  words: LessonWord[] | null;
};

function mapBook(row: BookRow): Book {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    category: row.category ?? '',
    coverUrl: row.cover_url ?? undefined,
    chapterCount: row.chapters?.[0]?.count ?? 0,
  };
}

function mapChapter(row: ChapterRow): Chapter {
  return {
    id: row.id,
    bookId: row.book_id,
    order: row.position ?? 0,
    title: row.title,
    description: row.description ?? '',
  };
}

function mapSegment(row: SegmentRow): LessonSegment {
  const translations: Translations = {};
  if (row.translation_fr) translations.fr = row.translation_fr;
  if (row.translation_shimaore) translations.shimaore = row.translation_shimaore;
  return {
    id: row.id,
    arabic: row.arabic ?? '',
    translations,
    words: row.words ?? undefined,
    audioUrl: row.audio_url ?? undefined,
  };
}

// Implémentation Supabase du contrat de contenu. Même interface que le mock :
// les écrans ne voient aucune différence.
export const supabaseContentRepository: ContentRepository = {
  async getBooks() {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('books')
      .select('*, chapters(count)')
      .order('position');
    if (error || !data) return [];
    return (data as BookRow[]).map(mapBook);
  },

  async getBook(id) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('books')
      .select('*, chapters(count)')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return null;
    return mapBook(data as BookRow);
  },

  async getChapters(bookId) {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('book_id', bookId)
      .order('position');
    if (error || !data) return [];
    return (data as ChapterRow[]).map(mapChapter);
  },

  async getChapter(id) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return null;
    return mapChapter(data as ChapterRow);
  },

  async getLesson(chapterId) {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('chapters')
      .select('audio_url, chapter_segments(*)')
      .eq('id', chapterId)
      .maybeSingle();
    if (error || !data) return null;

    const rows = ((data as { chapter_segments?: SegmentRow[] }).chapter_segments ?? [])
      .slice()
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    if (rows.length === 0) return null;

    const lesson: Lesson = {
      chapterId,
      segments: rows.map(mapSegment),
      audioUrl: (data as { audio_url: string | null }).audio_url ?? undefined,
    };
    return lesson;
  },
};
