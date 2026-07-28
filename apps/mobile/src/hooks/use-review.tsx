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

import { useCloudSync } from '@/hooks/use-cloud-sync';

// Révision espacée (façon Leitner). Chaque question a un « niveau » et une
// date d'échéance. Réussie → elle remonte d'un niveau et revient plus tard ;
// ratée → elle redevient due immédiatement (« à revoir »). Local (AsyncStorage).

const INTERVALS_DAYS = [1, 3, 7, 16, 35, 90];
const DAY_MS = 24 * 60 * 60 * 1000;
const STORAGE_KEY = 'babou:review';

type ReviewItem = { chapterId: string; level: number; dueAt: number };
type Schedule = Record<string, ReviewItem>;

export type ReviewOutcome = { questionId: string; chapterId: string; correct: boolean };
export type DueQuestion = { questionId: string; chapterId: string };

type ReviewContextValue = {
  schedule: Schedule;
  getDueItems: () => DueQuestion[];
  recordOutcomes: (entries: ReviewOutcome[]) => void;
};

const ReviewContext = createContext<ReviewContextValue | null>(null);

export function ReviewProvider({ children }: { children: ReactNode }) {
  const [schedule, setSchedule] = useState<Schedule>({});
  const hydrated = useRef(false);
  const scheduleRef = useRef(schedule);
  scheduleRef.current = schedule;

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setSchedule(JSON.parse(raw) as Schedule);
      } catch {
        // stockage indisponible : pas de révision programmée
      } finally {
        hydrated.current = true;
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(schedule)).catch(() => {});
  }, [schedule]);

  // Synchro cloud : par question, on garde le niveau le plus avancé.
  useCloudSync(
    'review',
    schedule,
    setSchedule,
    (local, remote) => {
      const merged: Schedule = { ...remote };
      for (const [qid, item] of Object.entries(local)) {
        const r = merged[qid];
        if (!r || item.level > r.level || (item.level === r.level && item.dueAt > r.dueAt)) {
          merged[qid] = item;
        }
      }
      return merged;
    },
    hydrated.current,
  );

  const recordOutcomes = useCallback((entries: ReviewOutcome[]) => {
    if (!entries.length) return;
    setSchedule((prev) => {
      const next = { ...prev };
      const now = Date.now();
      for (const entry of entries) {
        const current = next[entry.questionId];
        let level = current?.level ?? 0;
        if (entry.correct) level = Math.min(level + 1, INTERVALS_DAYS.length - 1);
        else level = 0;
        // Ratée → due tout de suite ; réussie → repoussée selon le niveau.
        const dueAt = entry.correct ? now + INTERVALS_DAYS[level] * DAY_MS : now;
        next[entry.questionId] = { chapterId: entry.chapterId, level, dueAt };
      }
      return next;
    });
  }, []);

  const getDueItems = useCallback((): DueQuestion[] => {
    const now = Date.now();
    return Object.entries(scheduleRef.current)
      .filter(([, item]) => item.dueAt <= now)
      .map(([questionId, item]) => ({ questionId, chapterId: item.chapterId }));
  }, []);

  const value = useMemo<ReviewContextValue>(
    () => ({ schedule, getDueItems, recordOutcomes }),
    [schedule, getDueItems, recordOutcomes],
  );

  return <ReviewContext.Provider value={value}>{children}</ReviewContext.Provider>;
}

export function useReview(): ReviewContextValue {
  const ctx = useContext(ReviewContext);
  if (!ctx) throw new Error('useReview doit être utilisé dans un ReviewProvider');
  return ctx;
}
