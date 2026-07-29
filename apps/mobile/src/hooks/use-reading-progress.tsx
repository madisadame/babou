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
  clearReadingProgress,
  deleteReadingProgress,
  fetchReadingProgress,
  pushReadingProgress,
  upsertReadingProgress,
} from '@/data/supabase/sync';
import { useAuth } from '@/hooks/use-auth';

// Progression de lecture par chapitre : fraction lue de 0 à 1, indexée par id.
type ProgressMap = Record<string, number>;

type ReadingProgressContextValue = {
  hasProgress: boolean;
  getProgress: (chapterId: string) => number;
  setProgress: (chapterId: string, value: number) => void;
  resetProgress: (chapterId: string) => void;
  resetAll: () => void;
  // Nombre de chapitres entamés / terminés (pour le profil).
  startedCount: number;
  completedCount: number;
};

const STORAGE_KEY = 'babou:reading-progress';

const ReadingProgressContext = createContext<ReadingProgressContextValue | null>(null);

export function ReadingProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [progress, setProgressState] = useState<ProgressMap>({});
  const hydrated = useRef(false);
  const progressRef = useRef(progress);
  const syncedUserId = useRef<string | null>(null);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  // Chargement initial depuis le cache local.
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

  // Sauvegarde locale à chaque changement (une fois hydraté).
  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress)).catch(() => {});
  }, [progress]);

  // À la connexion : fusionner le distant avec le local (on garde le max par
  // chapitre), appliquer, puis repousser la fusion sur le serveur.
  useEffect(() => {
    if (!user || !supabase) {
      syncedUserId.current = null;
      return;
    }
    if (syncedUserId.current === user.id) return;
    syncedUserId.current = user.id;
    let active = true;
    (async () => {
      const remote = await fetchReadingProgress(user.id);
      if (!active) return;
      const merged: ProgressMap = { ...progressRef.current };
      for (const [chapterId, value] of Object.entries(remote)) {
        merged[chapterId] = Math.max(merged[chapterId] ?? 0, value);
      }
      setProgressState(merged);
      pushReadingProgress(user.id, merged).catch(() => {});
    })();
    return () => {
      active = false;
    };
  }, [user]);

  const value = useMemo<ReadingProgressContextValue>(
    () => ({
      hasProgress: Object.keys(progress).length > 0,
      startedCount: Object.keys(progress).length,
      completedCount: Object.values(progress).filter((p) => p >= 0.9).length,
      getProgress: (chapterId) => progress[chapterId] ?? 0,
      setProgress: (chapterId, next) => {
        const clamped = Math.max(0, Math.min(1, next));
        const current = progressRef.current[chapterId] ?? 0;
        // Progression monotone + anti-churn (< 1 %).
        if (clamped <= current + 0.01) return;
        setProgressState((prev) => ({ ...prev, [chapterId]: clamped }));
        if (user && supabase) upsertReadingProgress(user.id, chapterId, clamped).catch(() => {});
      },
      resetProgress: (chapterId) => {
        setProgressState((prev) => {
          if (!(chapterId in prev)) return prev;
          const nextState = { ...prev };
          delete nextState[chapterId];
          return nextState;
        });
        if (user && supabase) deleteReadingProgress(user.id, chapterId).catch(() => {});
      },
      resetAll: () => {
        setProgressState({});
        if (user && supabase) clearReadingProgress(user.id).catch(() => {});
      },
    }),
    [progress, user],
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
