import { useEffect, useState } from 'react';

import type { Book } from '@/domain/book';
import type { Chapter } from '@/domain/chapter';
import { contentRepository } from '@/data/content-repository';

type AsyncState<T> = { data: T | null; loading: boolean };

// Petit utilitaire : exécute un chargement asynchrone et expose data + loading.
// Ignore les résultats obsolètes si les dépendances changent (course évitée).
function useAsync<T>(loader: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true });

  useEffect(() => {
    let active = true;
    setState({ data: null, loading: true });
    loader()
      .then((data) => {
        if (active) setState({ data, loading: false });
      })
      .catch(() => {
        if (active) setState({ data: null, loading: false });
      });
    return () => {
      active = false;
    };
    // Les dépendances sont fournies par l'appelant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

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

export type { Book, Chapter };
