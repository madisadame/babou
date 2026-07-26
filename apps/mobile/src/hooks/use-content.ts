import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { Book } from '@/domain/book';
import type { Chapter } from '@/domain/chapter';
import type { Lesson } from '@/domain/lesson';
import type { Question } from '@/domain/quiz';
import { contentRepository } from '@/data/content-repository';

type AsyncState<T> = { data: T | null; loading: boolean };

// Petit utilitaire : exécute un chargement asynchrone et expose data + loading.
// Recharge à chaque fois que l'écran (re)prend le focus (les modifications de
// l'admin apparaissent au retour) ET quand les dépendances changent. Les
// données déjà affichées restent visibles pendant le rechargement (pas de flash).
function useAsync<T>(loader: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true });

  const load = useCallback(() => {
    let active = true;
    setState((prev) => ({ data: prev.data, loading: prev.data === null }));
    loader()
      .then((data) => {
        if (active) setState({ data, loading: false });
      })
      .catch(() => {
        if (active) setState((prev) => ({ data: prev.data, loading: false }));
      });
    return () => {
      active = false;
    };
    // Les dépendances sont fournies par l'appelant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useFocusEffect(load);

  return state;
}

export function useBooks() {
  const { data, loading } = useAsync(() => contentRepository.getBooks(), []);
  return { books: data ?? [], loading };
}

export function useBook(id: string) {
  const { data, loading } = useAsync(() => contentRepository.getBook(id), [id]);
  return { book: data, loading };
}

export function useChapters(bookId: string) {
  const { data, loading } = useAsync(() => contentRepository.getChapters(bookId), [bookId]);
  return { chapters: data ?? [], loading };
}

export function useChapter(id: string) {
  const { data, loading } = useAsync(() => contentRepository.getChapter(id), [id]);
  return { chapter: data, loading };
}

export function useLesson(chapterId: string) {
  const { data, loading } = useAsync(() => contentRepository.getLesson(chapterId), [chapterId]);
  return { lesson: data, loading };
}

export function useQuestions(chapterId: string) {
  const { data, loading } = useAsync(() => contentRepository.getQuestions(chapterId), [chapterId]);
  return { questions: data ?? [], loading };
}

export type { Book, Chapter, Lesson, Question };
