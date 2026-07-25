import type { Book } from '@/domain/book';
import type { Chapter } from '@/domain/chapter';
import type { Lesson, LessonSegment, LessonWord, Translations } from '@/domain/lesson';
import type { Question, QuestionChoice } from '@/domain/quiz';
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

type ChoiceRow = {
  choice_key: string;
  position: number | null;
  text_fr: string | null;
  text_shimaore: string | null;
};

type QuestionRow = {
  id: string;
  chapter_id: string;
  position: number | null;
  prompt_fr: string | null;
  prompt_shimaore: string | null;
  correct_choice_key: string;
  explanation_fr: string | null;
  explanation_shimaore: string | null;
  question_choices?: ChoiceRow[];
};

function localized(fr: string | null, shimaore: string | null): Translations {
  const translations: Translations = {};
  if (fr) translations.fr = fr;
  if (shimaore) translations.shimaore = shimaore;
  return translations;
}

function mapChoice(row: ChoiceRow): QuestionChoice {
  return { id: row.choice_key, text: localized(row.text_fr, row.text_shimaore) };
}

function mapQuestion(row: QuestionRow): Question {
  const choices = (row.question_choices ?? [])
    .slice()
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map(mapChoice);
  return {
    id: row.id,
    chapterId: row.chapter_id,
    order: row.position ?? 0,
    prompt: localized(row.prompt_fr, row.prompt_shimaore),
    choices,
    correctChoiceId: row.correct_choice_key,
    explanation: localized(row.explanation_fr, row.explanation_shimaore),
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

  async getQuestions(chapterId) {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('questions')
      .select('*, question_choices(*)')
      .eq('chapter_id', chapterId)
      .order('position');
    if (error || !data) return [];
    return (data as QuestionRow[]).map(mapQuestion);
  },
};
