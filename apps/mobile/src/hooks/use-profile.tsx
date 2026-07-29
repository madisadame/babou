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

// Avatars disponibles (emojis sobres, dans l'esprit de Babou).
export const AVATARS = [
  '🌙',
  '⭐',
  '✨',
  '🌟',
  '💫',
  '📖',
  '📚',
  '📿',
  '🕌',
  '🕋',
  '🤲',
  '🌿',
  '🌴',
  '🏔️',
  '🌅',
  '🐫',
] as const;

export type Profile = { name: string; avatar: string };

const DEFAULT_PROFILE: Profile = { name: '', avatar: '🌙' };
const STORAGE_KEY = 'babou:profile';

type ProfileContextValue = Profile & {
  setName: (name: string) => void;
  setAvatar: (avatar: string) => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const hydrated = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(raw) });
      } catch {
        // stockage indisponible
      } finally {
        hydrated.current = true;
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile)).catch(() => {});
  }, [profile]);

  // Synchro cloud : par champ, la valeur du compte l'emporte si elle est définie.
  useCloudSync(
    'profile',
    profile,
    setProfile,
    (local, remote) => ({
      name: remote.name || local.name,
      avatar: remote.avatar || local.avatar,
    }),
    hydrated.current,
  );

  const setName = useCallback((name: string) => setProfile((p) => ({ ...p, name })), []);
  const setAvatar = useCallback((avatar: string) => setProfile((p) => ({ ...p, avatar })), []);

  const value = useMemo<ProfileContextValue>(
    () => ({ ...profile, setName, setAvatar }),
    [profile, setName, setAvatar],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile doit être utilisé dans un ProfileProvider');
  return ctx;
}
