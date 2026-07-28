import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import type { Chapter } from '@/domain/chapter';
import { useCloudSync } from '@/hooks/use-cloud-sync';

// Marque-pages : chapitres mis de côté par l'utilisateur pour les retrouver
// rapidement. Local (AsyncStorage).

export type Bookmark = {
  chapterId: string;
  bookId: string;
  chapterTitle: string;
  order: number;
  at: number;
};

type BookmarksContextValue = {
  bookmarks: Bookmark[];
  isBookmarked: (chapterId: string) => boolean;
  toggle: (chapter: Chapter) => void;
  remove: (chapterId: string) => void;
};

const STORAGE_KEY = 'babou:bookmarks';

const BookmarksContext = createContext<BookmarksContextValue | null>(null);

export function BookmarksProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<Record<string, Bookmark>>({});
  const hydrated = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setMap(JSON.parse(raw) as Record<string, Bookmark>);
      } catch {
        // stockage indisponible
      } finally {
        hydrated.current = true;
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map)).catch(() => {});
  }, [map]);

  // Synchro cloud : union des marque-pages entre appareils.
  useCloudSync(
    'bookmarks',
    map,
    setMap,
    (local, remote) => ({ ...remote, ...local }),
    hydrated.current,
  );

  const toggle = useCallback((chapter: Chapter) => {
    setMap((prev) => {
      const next = { ...prev };
      if (next[chapter.id]) {
        delete next[chapter.id];
      } else {
        next[chapter.id] = {
          chapterId: chapter.id,
          bookId: chapter.bookId,
          chapterTitle: chapter.title,
          order: chapter.order,
          at: Date.now(),
        };
      }
      return next;
    });
  }, []);

  const remove = useCallback((chapterId: string) => {
    setMap((prev) => {
      if (!prev[chapterId]) return prev;
      const next = { ...prev };
      delete next[chapterId];
      return next;
    });
  }, []);

  const value = useMemo<BookmarksContextValue>(() => {
    const bookmarks = Object.values(map).sort((a, b) => b.at - a.at);
    return {
      bookmarks,
      isBookmarked: (chapterId) => !!map[chapterId],
      toggle,
      remove,
    };
  }, [map, toggle, remove]);

  return <BookmarksContext.Provider value={value}>{children}</BookmarksContext.Provider>;
}

export function useBookmarks(): BookmarksContextValue {
  const ctx = useContext(BookmarksContext);
  if (!ctx) throw new Error('useBookmarks doit être utilisé dans un BookmarksProvider');
  return ctx;
}
