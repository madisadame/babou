import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { Book } from '@/domain/book';
import type { Chapter } from '@/domain/chapter';
import type { Lesson } from '@/domain/lesson';
import type { Question } from '@/domain/quiz';
import { contentRepository } from '@/data/content-repository';

// `failed` distingue « le chargement a échoué » de « il n'y a rien à
// afficher ». Sans cette distinction, une panne réseau s'affichait comme un
// catalogue vide.
type AsyncState<T> = { data: T | null; loading: boolean; failed: boolean };
type AsyncResult<T> = AsyncState<T> & { reload: () => void };

// Petit utilitaire : exécute un chargement asynchrone et expose data + loading.
// Recharge à chaque fois que l'écran (re)prend le focus (les modifications de
// l'admin apparaissent au retour) ET quand les dépendances changent. Les
// données déjà affichées restent visibles pendant le rechargement (pas de flash).
function useAsync<T>(loader: () => Promise<T>, deps: unknown[]): AsyncResult<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    failed: false,
  });
  // Incrémenté par reload() pour relancer le chargement à la demande (bouton
  // « Réessayer »), sans attendre que l'écran reprenne le focus.
  const [essai, setEssai] = useState(0);

  const load = useCallback(() => {
    let active = true;
    setState((prev) => ({ ...prev, loading: prev.data === null, failed: false }));
    loader()
      .then((data) => {
        if (active) setState({ data, loading: false, failed: false });
      })
      .catch(() => {
        // On garde les données déjà affichées : un rechargement raté ne doit pas
        // vider un écran qui fonctionnait.
        if (active) setState((prev) => ({ data: prev.data, loading: false, failed: true }));
      });
    return () => {
      active = false;
    };
    // Les dépendances sont fournies par l'appelant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, essai]);

  useFocusEffect(load);

  return { ...state, reload: () => setEssai((n) => n + 1) };
}

export function useBooks() {
  const { data, loading, failed, reload } = useAsync(() => contentRepository.getBooks(), []);
  return { books: data ?? [], loading, failed, reload };
}

export function useBook(id: string) {
  const { data, loading, failed, reload } = useAsync(() => contentRepository.getBook(id), [id]);
  return { book: data, loading, failed, reload };
}

export function useChapters(bookId: string) {
  const { data, loading, failed, reload } = useAsync(() => contentRepository.getChapters(bookId), [bookId]);
  return { chapters: data ?? [], loading, failed, reload };
}

export function useChapter(id: string) {
  const { data, loading, failed, reload } = useAsync(() => contentRepository.getChapter(id), [id]);
  return { chapter: data, loading, failed, reload };
}

export function useLesson(chapterId: string) {
  const { data, loading, failed, reload } = useAsync(() => contentRepository.getLesson(chapterId), [chapterId]);
  return { lesson: data, loading, failed, reload };
}

export function useQuestions(chapterId: string) {
  const { data, loading, failed, reload } = useAsync(() => contentRepository.getQuestions(chapterId), [chapterId]);
  return { questions: data ?? [], loading, failed, reload };
}

export type { Book, Chapter, Lesson, Question };
