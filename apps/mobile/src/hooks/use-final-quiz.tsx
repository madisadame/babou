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

// Quiz final par livre : une progression persistante (0 → 100 %) qui se
// remplit au fil des réponses. +2 % par bonne réponse, −5 % par erreur.
// Validé à 100 %. Les questions sont tirées au hasard des quiz de chapitre
// déjà faits (voir l'écran de session). Local (AsyncStorage).

export const STEP_CORRECT = 2;
export const STEP_WRONG = 5;

const STORAGE_KEY = 'babou:final-quiz';

type ProgressMap = Record<string, number>; // bookId -> 0..100

type FinalQuizContextValue = {
  getProgress: (bookId: string) => number;
  setProgress: (bookId: string, value: number) => void;
  isValidated: (bookId: string) => boolean;
};

const FinalQuizContext = createContext<FinalQuizContextValue | null>(null);

export function FinalQuizProvider({ children }: { children: ReactNode }) {
  const [progress, setProgressState] = useState<ProgressMap>({});
  const hydrated = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setProgressState(JSON.parse(raw) as ProgressMap);
      } catch {
        // stockage indisponible
      } finally {
        hydrated.current = true;
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress)).catch(() => {});
  }, [progress]);

  const setProgress = useCallback((bookId: string, value: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(value)));
    setProgressState((prev) => ({ ...prev, [bookId]: clamped }));
  }, []);

  const value = useMemo<FinalQuizContextValue>(
    () => ({
      getProgress: (bookId) => progress[bookId] ?? 0,
      setProgress,
      isValidated: (bookId) => (progress[bookId] ?? 0) >= 100,
    }),
    [progress, setProgress],
  );

  return <FinalQuizContext.Provider value={value}>{children}</FinalQuizContext.Provider>;
}

export function useFinalQuiz(): FinalQuizContextValue {
  const ctx = useContext(FinalQuizContext);
  if (!ctx) throw new Error('useFinalQuiz doit être utilisé dans un FinalQuizProvider');
  return ctx;
}
