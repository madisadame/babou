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

// Vrai en environnement client (React Native ou navigateur), faux côté Node
// (rendu statique d'expo-router). En Node, AsyncStorage n'est pas utilisable
// (`window is not defined`) : on évite donc la persistance de session, sinon
// l'initialisation de l'auth Supabase ferait planter le serveur Metro.
const canPersistSession = typeof window !== 'undefined';

// Client Supabase, créé seulement si configuré. En contexte client, la session
// est persistée (AsyncStorage) et le token rafraîchi automatiquement.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: canPersistSession
        ? {
            storage: AsyncStorage,
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: false,
          }
        : {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
    })
  : null;

// Recommandation Supabase pour React Native : rafraîchir le token seulement
// quand l'app est au premier plan.
if (supabase && canPersistSession) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
