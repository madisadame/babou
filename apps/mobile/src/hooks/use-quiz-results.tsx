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

import { supabase } from '@/data/supabase/client';
import {
  clearQuizResults,
  fetchQuizResults,
  pushQuizResults,
  upsertQuizResult,
} from '@/data/supabase/sync';
import { useAuth } from '@/hooks/use-auth';

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
  const { user } = useAuth();
  const [results, setResults] = useState<ResultsMap>({});
  const hydrated = useRef(false);
  const resultsRef = useRef(results);
  const syncedUserId = useRef<string | null>(null);

  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

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

  // À la connexion : fusionner distant et local en gardant le plus récent
  // (updatedAt) par chapitre, puis repousser la fusion.
  useEffect(() => {
    if (!user || !supabase) {
      syncedUserId.current = null;
      return;
    }
    if (syncedUserId.current === user.id) return;
    syncedUserId.current = user.id;
    let active = true;
    (async () => {
      const remote = await fetchQuizResults(user.id);
      if (!active) return;
      const merged: ResultsMap = { ...resultsRef.current };
      for (const [chapterId, result] of Object.entries(remote)) {
        const current = merged[chapterId];
        if (!current || result.updatedAt > current.updatedAt) merged[chapterId] = result;
      }
      setResults(merged);
      pushQuizResults(user.id, merged).catch(() => {});
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const value = useMemo<QuizResultsContextValue>(
    () => ({
      hasResults: Object.keys(results).length > 0,
      getResult: (chapterId) => results[chapterId],
      recordResult: (chapterId, outcomes) => {
        const previous = resultsRef.current[chapterId];
        // Statut cumulé : « maîtrisée » si réussie, « à revoir » sinon.
        const status: Record<string, QuestionStatus> = { ...(previous?.status ?? {}) };
        for (const outcome of outcomes) {
          status[outcome.questionId] = outcome.correct ? 'mastered' : 'toReview';
        }
        const result: QuizResult = {
          total: outcomes.length,
          correct: outcomes.filter((outcome) => outcome.correct).length,
          attempts: (previous?.attempts ?? 0) + 1,
          status,
          updatedAt: Date.now(),
        };
        setResults((prev) => ({ ...prev, [chapterId]: result }));
        if (user && supabase) upsertQuizResult(user.id, chapterId, result).catch(() => {});
      },
      resetAll: () => {
        setResults({});
        if (user && supabase) clearQuizResults(user.id).catch(() => {});
      },
    }),
    [results, user],
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
