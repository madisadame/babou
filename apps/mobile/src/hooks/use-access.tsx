import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { fetchAppConfig, fetchMyOverride } from '@/data/supabase/access';
import { configurePurchases, hasActiveSubscription } from '@/data/purchases';
import { useAuth } from '@/hooks/use-auth';

const TRIAL_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

type AccessContextValue = {
  // Rendu final : l'utilisateur peut-il accéder au contenu ?
  hasAccess: boolean;
  // L'abonnement est-il activé au niveau de l'app ?
  subscriptionEnabled: boolean;
  // L'utilisateur a-t-il un abonnement actif (store) ?
  subscribed: boolean;
  // Accès offert par un admin.
  overridden: boolean;
  // Fin de la période d'essai (null si non applicable).
  trialEndsAt: Date | null;
  // Jours restants d'essai (0 si terminé ou non applicable).
  trialDaysLeft: number;
  loading: boolean;
  refresh: () => Promise<void>;
};

const AccessContext = createContext<AccessContextValue | null>(null);

export function AccessProvider({ children }: { children: ReactNode }) {
  const { user, isAdmin } = useAuth();
  const [subscriptionEnabled, setSubscriptionEnabled] = useState(false);
  const [activatedAt, setActivatedAt] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [overridden, setOverridden] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const config = await fetchAppConfig();
    setSubscriptionEnabled(config.subscriptionEnabled);
    setActivatedAt(config.activatedAt);

    // L'abonnement store est lié au compte (RevenueCat login).
    await configurePurchases(user?.id ?? null);
    const active = await hasActiveSubscription();
    setSubscribed(active);

    setOverridden(user ? await fetchMyOverride(user.id) : false);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load().catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  // Fin d'essai = max(création du compte, activation de l'abonnement) + 7 jours.
  // → utilisateurs déjà inscrits : 7 j de grâce dès l'activation.
  // → nouveaux inscrits : 7 j à partir de leur inscription.
  const trialEndsAt = useMemo(() => {
    if (!subscriptionEnabled || !activatedAt || !user?.createdAt) return null;
    const start = Math.max(new Date(activatedAt).getTime(), new Date(user.createdAt).getTime());
    return new Date(start + TRIAL_DAYS * DAY_MS);
  }, [subscriptionEnabled, activatedAt, user?.createdAt]);

  const value = useMemo<AccessContextValue>(() => {
    const inTrial = trialEndsAt ? Date.now() < trialEndsAt.getTime() : false;
    const trialDaysLeft = trialEndsAt
      ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / DAY_MS))
      : 0;
    // Les admins ne sont jamais bloqués.
    const hasAccess =
      !subscriptionEnabled || isAdmin || subscribed || overridden || inTrial;
    return {
      hasAccess,
      subscriptionEnabled,
      subscribed,
      overridden,
      trialEndsAt,
      trialDaysLeft,
      loading,
      refresh: load,
    };
  }, [subscriptionEnabled, isAdmin, subscribed, overridden, trialEndsAt, loading, load]);

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useAccess() {
  const ctx = useContext(AccessContext);
  if (!ctx) throw new Error('useAccess doit être utilisé dans un AccessProvider');
  return ctx;
}
