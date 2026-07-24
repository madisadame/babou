import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

// Progression de lecture par livre : fraction lue de 0 à 1, indexée par id.
type ProgressMap = Record<string, number>;

type ReadingProgressContextValue = {
  getProgress: (bookId: string) => number;
  setProgress: (bookId: string, value: number) => void;
  resetProgress: (bookId: string) => void;
};

const STORAGE_KEY = 'babou:reading-progress';

const ReadingProgressContext = createContext<ReadingProgressContextValue | null>(null);

export function ReadingProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgressState] = useState<ProgressMap>({});
  const hydrated = useRef(false);

  // Chargement initial depuis le stockage persistant.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setProgressState(JSON.parse(raw));
      } catch {
        // Stockage indisponible : on repart d'un état vide.
      } finally {
        hydrated.current = true;
      }
    })();
  }, []);

  // Sauvegarde à chaque changement (une fois l'état initial chargé).
  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress)).catch(() => {});
  }, [progress]);

  const value = useMemo<ReadingProgressContextValue>(
    () => ({
      getProgress: (bookId) => progress[bookId] ?? 0,
      setProgress: (bookId, next) => {
        const clamped = Math.max(0, Math.min(1, next));
        setProgressState((prev) => {
          const current = prev[bookId] ?? 0;
          // Progression monotone (on garde le point le plus loin atteint) et
          // anti-churn : on ignore les micro-variations (< 1 %).
          if (clamped <= current + 0.01) return prev;
          return { ...prev, [bookId]: clamped };
        });
      },
      resetProgress: (bookId) => {
        setProgressState((prev) => {
          if (!(bookId in prev)) return prev;
          const next = { ...prev };
          delete next[bookId];
          return next;
        });
      },
    }),
    [progress],
  );

  return (
    <ReadingProgressContext.Provider value={value}>{children}</ReadingProgressContext.Provider>
  );
}

export function useReadingProgress() {
  const ctx = useContext(ReadingProgressContext);
  if (!ctx) {
    throw new Error('useReadingProgress doit être utilisé dans un ReadingProgressProvider');
  }
  return ctx;
}
