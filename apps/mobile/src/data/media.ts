import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/data/supabase/client';

// Sélection et upload de médias vers Supabase Storage (bucket « media »),
// pour l'espace d'administration. Retourne l'URL publique à mettre dans le
// champ du formulaire (cover_url, audio_url).

export type PickedFile = { uri: string; ext: string; contentType: string };

export async function pickImage(): Promise<PickedFile | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.85,
  });
  if (result.canceled || !result.assets.length) return null;
  const asset = result.assets[0];
  const ext = (asset.uri.split('.').pop() || 'jpg').toLowerCase();
  return { uri: asset.uri, ext, contentType: asset.mimeType || 'image/jpeg' };
}

export async function pickAudio(): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'audio/*',
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets.length) return null;
  const asset = result.assets[0];
  const ext = (asset.name?.split('.').pop() || 'mp3').toLowerCase();
  return { uri: asset.uri, ext, contentType: asset.mimeType || 'audio/mpeg' };
}

export async function uploadMedia(
  file: PickedFile,
  folder: string,
): Promise<{ url: string | null; error: string | null }> {
  if (!supabase) return { url: null, error: 'unavailable' };
  try {
    const bytes = await new File(file.uri).bytes();
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${file.ext}`;
    const { error } = await supabase.storage
      .from('media')
      .upload(path, bytes, { contentType: file.contentType, upsert: false });
    if (error) return { url: null, error: error.message };
    const { data } = supabase.storage.from('media').getPublicUrl(path);
    return { url: data.publicUrl, error: null };
  } catch (e) {
    return { url: null, error: e instanceof Error ? e.message : String(e) };
  }
}
