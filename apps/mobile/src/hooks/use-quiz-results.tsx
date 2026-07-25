import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

// Statut d'une question, mémorisé d'un passage à l'autre.
export type QuestionStatus = 'mastered' | 'toReview';

// Résultat de quiz d'un chapitre.
export type QuizResult = {
  total: number; // nombre de questions au dernier passage
  correct: number; // bonnes réponses au dernier passage
  attempts: number; // nombre de passages
  status: Record<string, QuestionStatus>; // statut cumulé par question
  updatedAt: number;
};

// Résultat d'une question lors d'un passage (transmis à recordResult).
export type QuestionOutcome = { questionId: string; correct: boolean };

type ResultsMap = Record<string, QuizResult>;

type QuizResultsContextValue = {
  hasResults: boolean;
  getResult: (chapterId: string) => QuizResult | undefined;
  recordResult: (chapterId: string, outcomes: QuestionOutcome[]) => void;
  resetAll: () => void;
};

const STORAGE_KEY = 'babou:quiz-results';

const QuizResultsContext = createContext<QuizResultsContextValue | null>(null);

export function QuizResultsProvider({ children }: { children: ReactNode }) {
  const [results, setResults] = useState<ResultsMap>({});
  const hydrated = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setResults(JSON.parse(raw));
      } catch {
        // Stockage indisponible : on repart d'un état vide.
      } finally {
        hydrated.current = true;
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(results)).catch(() => {});
  }, [results]);

  const value = useMemo<QuizResultsContextValue>(
    () => ({
      hasResults: Object.keys(results).length > 0,
      getResult: (chapterId) => results[chapterId],
      recordResult: (chapterId, outcomes) => {
        setResults((prev) => {
          // Statut cumulé : on part du précédent, chaque question passe à
          // « maîtrisée » si réussie, « à revoir » sinon.
          const status: Record<string, QuestionStatus> = { ...(prev[chapterId]?.status ?? {}) };
          for (const outcome of outcomes) {
            status[outcome.questionId] = outcome.correct ? 'mastered' : 'toReview';
          }
          const result: QuizResult = {
            total: outcomes.length,
            correct: outcomes.filter((outcome) => outcome.correct).length,
            attempts: (prev[chapterId]?.attempts ?? 0) + 1,
            status,
            updatedAt: Date.now(),
          };
          return { ...prev, [chapterId]: result };
        });
      },
      resetAll: () => setResults({}),
    }),
    [results],
  );

  return <QuizResultsContext.Provider value={value}>{children}</QuizResultsContext.Provider>;
}

export function useQuizResults() {
  const ctx = useContext(QuizResultsContext);
  if (!ctx) {
    throw new Error('useQuizResults doit être utilisé dans un QuizResultsProvider');
  }
  return ctx;
}
