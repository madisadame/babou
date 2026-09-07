import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import { supabase } from '@/data/supabase/client';

// Sélection et upload de médias vers Supabase Storage (bucket « media »),
// pour l'espace d'administration. Retourne l'URL publique à mettre dans le
// champ du formulaire (cover_url, audio_url).
//
// L'extension est déduite du TYPE MIME, jamais de l'URI. Sur le web,
// ImagePicker renvoie une URI `blob:http://…` dépourvue d'extension : en
// prenant naïvement ce qui suit le dernier point, on récupérait l'URI entière,
// qui finissait dans le nom du fichier stocké. Le bucket en a gardé cinq
// objets de 0 octet nommés `…-8nle7d.blob:http:`, illisibles — leur nom casse
// l'URL de téléchargement.

// Types acceptés, et l'extension canonique de chacun. Toute liste blanche vaut
// mieux qu'une liste noire : ce qui n'est pas prévu est refusé.
const TYPES_IMAGE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

const TYPES_AUDIO: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/aac': 'aac',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/opus': 'opus',
  'audio/webm': 'webm',
};

// Un fichier plus gros est presque toujours une erreur de manipulation, et
// coûterait de la bande passante à chaque lecteur.
const TAILLE_MAX_IMAGE = 10 * 1024 * 1024; // 10 Mo
const TAILLE_MAX_AUDIO = 60 * 1024 * 1024; // 60 Mo

export type PickedFile = { uri: string; ext: string; contentType: string };

// Normalise un type MIME : `audio/mpeg; codecs=…` -> `audio/mpeg`.
function typeSimple(t: string | null | undefined): string {
  return (t ?? '').split(';')[0].trim().toLowerCase();
}

// Extension candidate tirée d'un nom de fichier, uniquement si elle est
// plausible : 1 à 5 caractères alphanumériques. Une URI `blob:http://…` ne
// produit donc rien.
function extensionDuNom(nom: string | null | undefined): string | null {
  if (!nom) return null;
  const dernier = nom.split(/[\\/]/).pop() ?? '';
  const point = dernier.lastIndexOf('.');
  if (point < 0) return null;
  const brut = dernier.slice(point + 1).toLowerCase();
  return /^[a-z0-9]{1,5}$/.test(brut) ? brut : null;
}

// Le type MIME fait foi ; le nom ne sert que de repli, et seulement s'il donne
// une extension déjà connue de la liste blanche.
function resoudreExtension(
  contentType: string,
  nom: string | null,
  table: Record<string, string>,
): string | null {
  const parType = table[typeSimple(contentType)];
  if (parType) return parType;
  const parNom = extensionDuNom(nom);
  if (parNom && Object.values(table).includes(parNom)) return parNom;
  return null;
}

export async function pickImage(): Promise<PickedFile | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.85,
  });
  if (result.canceled || !result.assets.length) return null;
  const asset = result.assets[0];
  const contentType = typeSimple(asset.mimeType) || 'image/jpeg';
  const ext = resoudreExtension(contentType, asset.fileName ?? null, TYPES_IMAGE);
  if (!ext) return null;
  return { uri: asset.uri, ext, contentType };
}

export async function pickAudio(): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'audio/*',
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets.length) return null;
  const asset = result.assets[0];
  const contentType = typeSimple(asset.mimeType) || 'audio/mpeg';
  const ext = resoudreExtension(contentType, asset.name ?? null, TYPES_AUDIO);
  if (!ext) return null;
  return { uri: asset.uri, ext, contentType };
}

export async function uploadMedia(
  file: PickedFile,
  folder: 'covers' | 'audio',
): Promise<{ url: string | null; error: string | null }> {
  if (!supabase) return { url: null, error: 'unavailable' };

  // Le dossier vient d'une union littérale, jamais d'une saisie : rien à
  // assainir ici. On revérifie tout de même, au cas où un appelant contourne
  // le typage.
  if (folder !== 'covers' && folder !== 'audio') {
    return { url: null, error: 'dossier invalide' };
  }

  const table = folder === 'covers' ? TYPES_IMAGE : TYPES_AUDIO;
  const ext = resoudreExtension(file.contentType, null, table);
  if (!ext) return { url: null, error: `type de fichier non accepté : ${typeSimple(file.contentType) || 'inconnu'}` };

  try {
    // Lecture des octets : expo-file-system n'existe pas sur le web → on y lit
    // le fichier via fetch (URI blob/data), et via File sur natif.
    const body =
      Platform.OS === 'web'
        ? await (await fetch(file.uri)).blob()
        : await new File(file.uri).bytes();

    const taille = body instanceof Blob ? body.size : body.byteLength;
    const max = folder === 'covers' ? TAILLE_MAX_IMAGE : TAILLE_MAX_AUDIO;
    if (taille === 0) return { url: null, error: 'fichier vide' };
    if (taille > max) {
      return { url: null, error: `fichier trop volumineux (${Math.round(taille / 1024 / 1024)} Mo, maximum ${max / 1024 / 1024} Mo)` };
    }

    // Nom entièrement généré : horodatage + aléa + extension de la liste
    // blanche. Aucun octet ne vient du fichier choisi, donc ni traversée de
    // chemin, ni caractère exotique.
    const nom = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = `${folder}/${nom}`;

    const { error } = await supabase.storage
      .from('media')
      .upload(path, body, { contentType: typeSimple(file.contentType), upsert: false });
    if (error) return { url: null, error: error.message };

    const { data } = supabase.storage.from('media').getPublicUrl(path);
    return { url: data.publicUrl, error: null };
  } catch (e) {
    return { url: null, error: e instanceof Error ? e.message : String(e) };
  }
}
