import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { DEFAULT_LOCALE, type Locale } from '@/domain/locale';
import type { CorrectionMode } from '@/domain/quiz';
import { useCloudSync } from '@/hooks/use-cloud-sync';

// Préférences utilisateur persistées : langue, mode de correction des quiz,
// et affichage de chaque carte de progression sur la bibliothèque (choix
// individuel de l'utilisateur).
export type ProgressCard = 'study' | 'review' | 'continue';

// Échelles de taille de texte de lecture (facteur multiplicateur).
export const READING_SCALES = [0.9, 1, 1.15, 1.3] as const;

// Vitesses de lecture audio disponibles.
export const PLAYBACK_RATES = [0.75, 1, 1.25, 1.5, 2] as const;

type Preferences = {
  language: Locale;
  correctionMode: CorrectionMode;
  showStudyCard: boolean;
  showReviewCard: boolean;
  showContinueCard: boolean;
  readingScale: number;
  playbackRate: number;
};

type PreferencesContextValue = Preferences & {
  setLanguage: (language: Locale) => void;
  setCorrectionMode: (mode: CorrectionMode) => void;
  setShowCard: (card: ProgressCard, show: boolean) => void;
  setReadingScale: (scale: number) => void;
  // Ajuste la taille d'un cran (+1 / -1) dans READING_SCALES.
  stepReadingScale: (direction: 1 | -1) => void;
  setPlaybackRate: (rate: number) => void;
  // Passe à la vitesse suivante (en boucle) dans PLAYBACK_RATES.
  cyclePlaybackRate: () => void;
};

const DEFAULT_PREFERENCES: Preferences = {
  language: DEFAULT_LOCALE,
  correctionMode: 'immediate',
  showStudyCard: true,
  showReviewCard: true,
  showContinueCard: true,
  readingScale: 1,
  playbackRate: 1,
};

const CARD_KEY: Record<ProgressCard, keyof Preferences> = {
  study: 'showStudyCard',
  review: 'showReviewCard',
  continue: 'showContinueCard',
};
const STORAGE_KEY = 'babou:preferences';

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const hydrated = useRef(false);

  // Chargement initial depuis le stockage.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const loaded = raw ? { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) } : { ...DEFAULT_PREFERENCES };
        setPreferences(loaded);
      } catch {
        // Stockage indisponible : on garde les valeurs par défaut.
      } finally {
        hydrated.current = true;
      }
    })();
  }, []);

  // Sauvegarde à chaque changement (une fois l'état initial chargé).
  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)).catch(() => {});
  }, [preferences]);

  // Synchro cloud : on adopte les préférences du compte (en gardant les clés
  // récentes absentes du distant).
  useCloudSync(
    'preferences',
    preferences,
    setPreferences,
    (local, remote) => ({ ...local, ...remote }),
    hydrated.current,
  );

  const value = useMemo<PreferencesContextValue>(
    () => ({
      ...preferences,
      setLanguage: (language) => setPreferences((prev) => ({ ...prev, language })),
      setCorrectionMode: (correctionMode) =>
        setPreferences((prev) => ({ ...prev, correctionMode })),
      setShowCard: (card, show) =>
        setPreferences((prev) => ({ ...prev, [CARD_KEY[card]]: show })),
      setReadingScale: (readingScale) => setPreferences((prev) => ({ ...prev, readingScale })),
      stepReadingScale: (direction) =>
        setPreferences((prev) => {
          const index = READING_SCALES.indexOf(prev.readingScale as (typeof READING_SCALES)[number]);
          const base = index === -1 ? 1 : index;
          const next = Math.max(0, Math.min(READING_SCALES.length - 1, base + direction));
          return { ...prev, readingScale: READING_SCALES[next] };
        }),
      setPlaybackRate: (playbackRate) => setPreferences((prev) => ({ ...prev, playbackRate })),
      cyclePlaybackRate: () =>
        setPreferences((prev) => {
          const index = PLAYBACK_RATES.indexOf(prev.playbackRate as (typeof PLAYBACK_RATES)[number]);
          const next = (index === -1 ? 1 : index + 1) % PLAYBACK_RATES.length;
          return { ...prev, playbackRate: PLAYBACK_RATES[next] };
        }),
    }),
    [preferences],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error('usePreferences doit être utilisé dans un PreferencesProvider');
  }
  return ctx;
}
