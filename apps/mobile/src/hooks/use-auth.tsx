import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { supabase } from '@/data/supabase/client';

export type AuthUser = { id: string; email: string };

type AuthResult = { error: string | null; needsConfirmation?: boolean };

type AuthContextValue = {
  user: AuthUser | null;
  isAdmin: boolean;
  loading: boolean;
  available: boolean;
  // Passe à true quand l'utilisateur ouvre l'app via un lien de
  // réinitialisation : on lui propose alors de choisir un nouveau mot de passe.
  recovering: boolean;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  // Supprime définitivement le compte et toutes ses données (exigence Apple).
  deleteAccount: () => Promise<AuthResult>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toUser(user: User | null | undefined): AuthUser | null {
  return user ? { id: user.id, email: user.email ?? '' } : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(toUser(data.session?.user));
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(toUser(session?.user));
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Vérifie le rôle admin à chaque changement d'utilisateur.
  useEffect(() => {
    if (!supabase || !user) {
      setIsAdmin(false);
      return;
    }
    let active = true;
    supabase
      .from('admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setIsAdmin(Boolean(data));
      });
    return () => {
      active = false;
    };
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAdmin,
      loading,
      available: Boolean(supabase),
      recovering,
      signUp: async (email, password) => {
        if (!supabase) return { error: 'unavailable' };
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) return { error: error.message };
        // Sans confirmation email : une session est créée immédiatement.
        return { error: null, needsConfirmation: !data.session };
      },
      signIn: async (email, password) => {
        if (!supabase) return { error: 'unavailable' };
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        return { error: error ? error.message : null };
      },
      signOut: async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
      },
      resetPassword: async (email) => {
        if (!supabase) return { error: 'unavailable' };
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: Linking.createURL('reset-password'),
        });
        return { error: error ? error.message : null };
      },
      updatePassword: async (password) => {
        if (!supabase) return { error: 'unavailable' };
        const { error } = await supabase.auth.updateUser({ password });
        if (error) return { error: error.message };
        setRecovering(false);
        return { error: null };
      },
      deleteAccount: async () => {
        if (!supabase) return { error: 'unavailable' };
        const { error } = await supabase.rpc('delete_own_account');
        if (error) return { error: error.message };
        await supabase.auth.signOut();
        // Efface les données locales pour repartir d'un état propre.
        try {
          const keys = await AsyncStorage.getAllKeys();
          const local = keys.filter((k) => k.startsWith('babou:'));
          if (local.length) await AsyncStorage.multiRemove(local);
        } catch {
          // stockage indisponible : rien de plus à faire
        }
        return { error: null };
      },
    }),
    [user, isAdmin, loading, recovering],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return ctx;
}
