import { supabase } from './client';

export type AppConfig = {
  subscriptionEnabled: boolean;
  // Date à laquelle l'abonnement a été activé (démarre la semaine de grâce).
  activatedAt: string | null;
};

const DEFAULT_CONFIG: AppConfig = { subscriptionEnabled: false, activatedAt: null };

// État d'abonnement global (lisible par tous, même hors connexion).
export async function fetchAppConfig(): Promise<AppConfig> {
  if (!supabase) return DEFAULT_CONFIG;
  const { data, error } = await supabase
    .from('app_config')
    .select('subscription_enabled, subscription_activated_at')
    .eq('id', 1)
    .maybeSingle();
  if (error || !data) return DEFAULT_CONFIG;
  return {
    subscriptionEnabled: Boolean(data.subscription_enabled),
    activatedAt: data.subscription_activated_at ?? null,
  };
}

// Accès offert manuellement à l'utilisateur courant.
export async function fetchMyOverride(userId: string): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await supabase
    .from('user_access')
    .select('manual_override')
    .eq('user_id', userId)
    .maybeSingle();
  return Boolean(data?.manual_override);
}

// ── Actions admin ──────────────────────────────────────────────

export async function setSubscriptionEnabled(enabled: boolean): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'unavailable' };
  const { error } = await supabase.rpc('set_subscription_enabled', { enabled });
  return { error: error ? error.message : null };
}

export async function setUserAccess(
  target: string,
  value: boolean,
  note?: string,
): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'unavailable' };
  const { error } = await supabase.rpc('set_user_access', { target, value, note: note ?? null });
  return { error: error ? error.message : null };
}

export type FoundUser = {
  userId: string;
  email: string;
  createdAt: string;
  hasAccess: boolean;
};

export async function findUsers(emailQuery: string): Promise<FoundUser[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('admin_find_user', { email_query: emailQuery });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((r) => ({
    userId: r.user_id as string,
    email: r.email as string,
    createdAt: r.created_at as string,
    hasAccess: Boolean(r.has_access),
  }));
}
