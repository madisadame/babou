import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

// Identifiants fournis via des variables d'environnement Expo (préfixe
// EXPO_PUBLIC_, injectées au build depuis apps/mobile/.env). Voir .env.example.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Vrai uniquement quand les deux identifiants sont présents. Sert à basculer
// automatiquement entre le mock (dev) et Supabase (config présente).
export const isSupabaseConfigured = Boolean(url && anonKey);

// Client Supabase, créé seulement si configuré. La session d'authentification
// est persistée (AsyncStorage) et le token rafraîchi automatiquement.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        storage: AsyncStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;

// Recommandation Supabase pour React Native : rafraîchir le token seulement
// quand l'app est au premier plan.
if (supabase) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
