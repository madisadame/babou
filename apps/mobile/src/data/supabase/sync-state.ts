import { supabase } from './client';

// Synchro générique d'un « état utilisateur » : une valeur JSON par (user, clé),
// stockée dans la table `user_state`. Utilisé pour les données locales qui
// doivent suivre l'utilisateur d'un appareil à l'autre (marque-pages, série,
// révision, quiz final, préférences, dernière lecture).

export async function fetchUserState<T>(userId: string, key: string): Promise<T | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('user_state')
    .select('value')
    .eq('user_id', userId)
    .eq('key', key)
    .maybeSingle();
  if (error || !data) return null;
  return (data.value ?? null) as T | null;
}

export async function pushUserState(userId: string, key: string, value: unknown): Promise<void> {
  if (!supabase) return;
  await supabase
    .from('user_state')
    .upsert(
      { user_id: userId, key, value, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,key' },
    );
}
