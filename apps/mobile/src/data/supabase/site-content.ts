import { supabase } from './client';

// Contenu éditable du site (textes gérés depuis l'admin, ex. page d'accueil).
// Clé → valeur. Lecture publique ; écriture réservée aux admins (RLS).

export async function fetchSiteContent(): Promise<Record<string, string>> {
  if (!supabase) return {};
  const { data, error } = await supabase.from('site_content').select('key, value');
  if (error || !data) return {};
  const map: Record<string, string> = {};
  for (const row of data as { key: string; value: string | null }[]) {
    if (row.value != null) map[row.key] = row.value;
  }
  return map;
}
