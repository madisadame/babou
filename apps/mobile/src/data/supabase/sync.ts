import type { QuizResult } from '@/hooks/use-quiz-results';

import { supabase } from './client';

// Synchro de la progression et des résultats de quiz, par utilisateur.
// Les tables sont protégées par RLS (auth.uid() = user_id) : chaque requête
// ne touche que les lignes de l'utilisateur connecté. Toutes les opérations
// sont « best-effort » (les erreurs réseau ne bloquent pas l'app locale).

export type ReadingProgressMap = Record<string, number>;
export type QuizResultsMap = Record<string, QuizResult>;

const nowIso = () => new Date().toISOString();

// ---- Progression de lecture ----

export async function fetchReadingProgress(userId: string): Promise<ReadingProgressMap> {
  if (!supabase) return {};
  const { data, error } = await supabase
    .from('reading_progress')
    .select('chapter_id, progress')
    .eq('user_id', userId);
  if (error || !data) return {};
  const map: ReadingProgressMap = {};
  for (const row of data as { chapter_id: string; progress: number }[]) {
    map[row.chapter_id] = row.progress;
  }
  return map;
}

export async function upsertReadingProgress(
  userId: string,
  chapterId: string,
  progress: number,
): Promise<void> {
  if (!supabase) return;
  await supabase
    .from('reading_progress')
    .upsert(
      { user_id: userId, chapter_id: chapterId, progress, updated_at: nowIso() },
      { onConflict: 'user_id,chapter_id' },
    );
}

export async function pushReadingProgress(userId: string, map: ReadingProgressMap): Promise<void> {
  if (!supabase) return;
  const rows = Object.entries(map).map(([chapter_id, progress]) => ({
    user_id: userId,
    chapter_id,
    progress,
    updated_at: nowIso(),
  }));
  if (rows.length) {
    await supabase.from('reading_progress').upsert(rows, { onConflict: 'user_id,chapter_id' });
  }
}

export async function deleteReadingProgress(userId: string, chapterId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('reading_progress').delete().eq('user_id', userId).eq('chapter_id', chapterId);
}

export async function clearReadingProgress(userId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('reading_progress').delete().eq('user_id', userId);
}

// ---- Résultats de quiz ----

type QuizRow = {
  chapter_id: string;
  total: number;
  correct: number;
  attempts: number;
  status: Record<string, 'mastered' | 'toReview'> | null;
  updated_at: string;
};

export async function fetchQuizResults(userId: string): Promise<QuizResultsMap> {
  if (!supabase) return {};
  const { data, error } = await supabase
    .from('quiz_results')
    .select('chapter_id, total, correct, attempts, status, updated_at')
    .eq('user_id', userId);
  if (error || !data) return {};
  const map: QuizResultsMap = {};
  for (const row of data as QuizRow[]) {
    map[row.chapter_id] = {
      total: row.total,
      correct: row.correct,
      attempts: row.attempts,
      status: row.status ?? {},
      updatedAt: new Date(row.updated_at).getTime(),
    };
  }
  return map;
}

function quizRow(userId: string, chapterId: string, result: QuizResult) {
  return {
    user_id: userId,
    chapter_id: chapterId,
    total: result.total,
    correct: result.correct,
    attempts: result.attempts,
    status: result.status,
    updated_at: new Date(result.updatedAt).toISOString(),
  };
}

export async function upsertQuizResult(
  userId: string,
  chapterId: string,
  result: QuizResult,
): Promise<void> {
  if (!supabase) return;
  await supabase
    .from('quiz_results')
    .upsert(quizRow(userId, chapterId, result), { onConflict: 'user_id,chapter_id' });
}

export async function pushQuizResults(userId: string, map: QuizResultsMap): Promise<void> {
  if (!supabase) return;
  const rows = Object.entries(map).map(([chapterId, result]) => quizRow(userId, chapterId, result));
  if (rows.length) {
    await supabase.from('quiz_results').upsert(rows, { onConflict: 'user_id,chapter_id' });
  }
}

export async function clearQuizResults(userId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('quiz_results').delete().eq('user_id', userId);
}
