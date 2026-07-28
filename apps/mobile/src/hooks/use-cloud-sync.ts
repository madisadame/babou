import { useEffect, useRef } from 'react';

import { supabase } from '@/data/supabase/client';
import { fetchUserState, pushUserState } from '@/data/supabase/sync-state';
import { useAuth } from '@/hooks/use-auth';

// Branche un état local (d'un provider) sur la synchro cloud :
// - à la connexion : récupère le distant, le fusionne avec le local (via
//   `merge`), applique le résultat, puis repousse la fusion ;
// - ensuite : à chaque changement local (une fois hydraté), repousse l'état.
// `merge(local, remote)` définit la stratégie propre à chaque donnée.
export function useCloudSync<T>(
  key: string,
  state: T,
  applyMerged: (merged: T) => void,
  merge: (local: T, remote: T) => T,
  hydrated: boolean,
): void {
  const { user } = useAuth();
  const stateRef = useRef(state);
  stateRef.current = state;
  const syncedUser = useRef<string | null>(null);

  // Connexion : fusion distant ↔ local.
  useEffect(() => {
    if (!user || !supabase) {
      syncedUser.current = null;
      return;
    }
    if (syncedUser.current === user.id) return;
    syncedUser.current = user.id;
    let active = true;
    (async () => {
      const remote = await fetchUserState<T>(user.id, key);
      if (!active) return;
      const merged = remote != null ? merge(stateRef.current, remote) : stateRef.current;
      applyMerged(merged);
      pushUserState(user.id, key, merged).catch(() => {});
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Changements locaux → envoi (léger anti-rebond).
  useEffect(() => {
    if (!hydrated || !user || !supabase) return;
    const timer = setTimeout(() => {
      pushUserState(user.id, key, stateRef.current).catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, user, hydrated]);
}
