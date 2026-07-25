import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { DEFAULT_LOCALE, type Locale } from '@/domain/locale';
import type { CorrectionMode } from '@/domain/quiz';

// Préférences utilisateur persistées : langue et mode de correction des quiz.
type Preferences = {
  language: Locale;
  correctionMode: CorrectionMode;
};

type PreferencesContextValue = Preferences & {
  setLanguage: (language: Locale) => void;
  setCorrectionMode: (mode: CorrectionMode) => void;
};

const DEFAULT_PREFERENCES: Preferences = { language: DEFAULT_LOCALE, correctionMode: 'immediate' };
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
        if (raw) setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(raw) });
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

  const value = useMemo<PreferencesContextValue>(
    () => ({
      ...preferences,
      setLanguage: (language) => setPreferences((prev) => ({ ...prev, language })),
      setCorrectionMode: (correctionMode) =>
        setPreferences((prev) => ({ ...prev, correctionMode })),
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
