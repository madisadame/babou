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

// Régularité douce : temps d'étude du jour, objectif quotidien (minutes) et
// série de jours consécutifs. Esprit bienveillant : la série se maintient dès
// qu'on étudie un peu dans la journée (pas besoin d'atteindre tout l'objectif),
// et il n'y a ni classement ni comparaison — c'est un rappel personnel.

export const GOAL_OPTIONS = [5, 10, 15, 20] as const;

type StudyState = {
  dayKey: string; // jour de `todaySeconds` (AAAA-MM-JJ)
  todaySeconds: number;
  streak: number;
  bestStreak: number;
  lastActiveDay: string | null; // dernier jour compté dans la série
  goalMinutes: number;
};

const DEFAULT_STATE: StudyState = {
  dayKey: '',
  todaySeconds: 0,
  streak: 0,
  bestStreak: 0,
  lastActiveDay: null,
  goalMinutes: 10,
};

const STORAGE_KEY = 'babou:study-goal';

function dayKeyOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}
function todayKey(): string {
  return dayKeyOf(new Date());
}
function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayKeyOf(d);
}

type StudyGoalContextValue = {
  todaySeconds: number;
  goalMinutes: number;
  streak: number; // série courante (0 si rompue)
  bestStreak: number;
  goalMet: boolean;
  addStudySeconds: (seconds: number) => void;
  setGoalMinutes: (minutes: number) => void;
};

const StudyGoalContext = createContext<StudyGoalContextValue | null>(null);

export function StudyGoalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StudyState>(DEFAULT_STATE);
  const hydrated = useRef(false);

  // Chargement + bascule de jour (remise à zéro du compteur du jour).
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const loaded: StudyState = raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : DEFAULT_STATE;
        const today = todayKey();
        if (loaded.dayKey !== today) {
          loaded.dayKey = today;
          loaded.todaySeconds = 0;
        }
        setState(loaded);
      } catch {
        setState(DEFAULT_STATE);
      } finally {
        hydrated.current = true;
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  // Stable (mise à jour fonctionnelle) : lit toujours l'état le plus récent.
  const addStudySeconds = useCallback((seconds: number) => {
    if (seconds <= 0) return;
    setState((prev) => {
      const today = todayKey();
      const next = { ...prev };
      if (next.dayKey !== today) {
        next.dayKey = today;
        next.todaySeconds = 0;
      }
      next.todaySeconds += seconds;
      if (next.lastActiveDay !== today) {
        next.streak = next.lastActiveDay === yesterdayKey() ? next.streak + 1 : 1;
        next.lastActiveDay = today;
        next.bestStreak = Math.max(next.bestStreak, next.streak);
      }
      return next;
    });
  }, []);

  const setGoalMinutes = useCallback((minutes: number) => {
    setState((prev) => ({ ...prev, goalMinutes: minutes }));
  }, []);

  const value = useMemo<StudyGoalContextValue>(() => {
    const today = todayKey();
    // Série affichée : intacte si la dernière activité est aujourd'hui ou hier.
    const streak =
      state.lastActiveDay === today || state.lastActiveDay === yesterdayKey() ? state.streak : 0;
    const todaySeconds = state.dayKey === today ? state.todaySeconds : 0;
    return {
      todaySeconds,
      goalMinutes: state.goalMinutes,
      streak,
      bestStreak: state.bestStreak,
      goalMet: todaySeconds >= state.goalMinutes * 60,
      addStudySeconds,
      setGoalMinutes,
    };
  }, [state, addStudySeconds, setGoalMinutes]);

  return <StudyGoalContext.Provider value={value}>{children}</StudyGoalContext.Provider>;
}

export function useStudyGoal(): StudyGoalContextValue {
  const ctx = useContext(StudyGoalContext);
  if (!ctx) throw new Error('useStudyGoal doit être utilisé dans un StudyGoalProvider');
  return ctx;
}
