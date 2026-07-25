import 'react-native-url-polyfill/auto';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Identifiants fournis via des variables d'environnement Expo (préfixe
// EXPO_PUBLIC_, injectées au build depuis apps/mobile/.env). Voir .env.example.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Vrai uniquement quand les deux identifiants sont présents. Sert à basculer
// automatiquement entre le mock (dev) et Supabase (config présente).
export const isSupabaseConfigured = Boolean(url && anonKey);

// Client Supabase, créé seulement si configuré. Lecture publique via la clé
// anon protégée par les politiques RLS : pas de session à persister.
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;
