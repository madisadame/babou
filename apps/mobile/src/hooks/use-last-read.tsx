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

// Mémorise le dernier chapitre ouvert, pour proposer « Reprendre la lecture »
// sur l'accueil. Local (AsyncStorage) : léger et suffisant pour un rappel.

export type LastRead = {
  bookId: string;
  chapterId: string;
  chapterTitle: string;
  order: number;
  at: number;
};

type LastReadContextValue = {
  lastRead: LastRead | null;
  recordRead: (chapter: Chapter) => void;
  clear: () => void;
};

const STORAGE_KEY = 'babou:last-read';

const LastReadContext = createContext<LastReadContextValue | null>(null);

export function LastReadProvider({ children }: { children: ReactNode }) {
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setLastRead(JSON.parse(raw) as LastRead);
      } catch {
        // stockage indisponible : pas de reprise, ce n'est pas bloquant
      } finally {
        hydrated.current = true;
      }
    })();
  }, []);

  const recordRead = useCallback((chapter: Chapter) => {
    const entry: LastRead = {
      bookId: chapter.bookId,
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      order: chapter.order,
      at: Date.now(),
    };
    setLastRead(entry);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entry)).catch(() => {});
  }, []);

  const clear = useCallback(() => {
    setLastRead(null);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, []);

  const value = useMemo<LastReadContextValue>(
    () => ({ lastRead, recordRead, clear }),
    [lastRead, recordRead, clear],
  );

  return <LastReadContext.Provider value={value}>{children}</LastReadContext.Provider>;
}

export function useLastRead(): LastReadContextValue {
  const ctx = useContext(LastReadContext);
  if (!ctx) throw new Error('useLastRead doit être utilisé dans un LastReadProvider');
  return ctx;
}
