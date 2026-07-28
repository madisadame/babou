import { Directory, File, Paths } from 'expo-file-system';

import type { Book } from '@/domain/book';
import type { Chapter } from '@/domain/chapter';
import type { Lesson } from '@/domain/lesson';
import type { Question } from '@/domain/quiz';
import type { ContentRepository } from '@/data/content-repository';

// Magasin hors-ligne : télécharge le contenu complet d'un livre (livre,
// chapitres, leçons, quiz) + ses médias (audio, couverture) dans un dossier
// local, en réécrivant les URLs vers les fichiers du téléphone. Le contenu
// est gardé en mémoire (chargé au démarrage) pour un accès instantané et
// hors connexion. Purement local : aucune dépendance au réseau ici.

const ROOT = 'babou-offline';
const BUNDLE_VERSION = 1;

// Contenu figé d'un livre téléchargé (URLs médias déjà réécrites en local).
export type OfflineBundle = {
  version: number;
  book: Book;
  chapters: Chapter[];
  lessons: Record<string, Lesson | null>;
  questions: Record<string, Question[]>;
};

export type DownloadMeta = {
  bookId: string;
  title: string;
  downloadedAt: number;
  chapters: number;
};

type Index = Record<string, DownloadMeta>;

const bundles = new Map<string, OfflineBundle>();
let index: Index = {};
let initPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function subscribeOffline(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function safe(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function rootDir(): Directory {
  return new Directory(Paths.document, ROOT);
}
function bookDir(bookId: string): Directory {
  return new Directory(rootDir(), safe(bookId));
}
function indexFile(): File {
  return new File(rootDir(), 'index.json');
}

function extFromUrl(url: string, fallback: string): string {
  const clean = url.split('?')[0];
  const ext = clean.split('.').pop();
  return ext && ext.length >= 1 && ext.length <= 5 ? ext : fallback;
}

// ---- initialisation : charge l'index et les contenus en mémoire ----
async function doInit(): Promise<void> {
  try {
    const root = rootDir();
    if (!root.exists) {
      root.create({ intermediates: true });
      return;
    }
    const idx = indexFile();
    if (!idx.exists) return;
    index = JSON.parse(await idx.text()) as Index;
    for (const bookId of Object.keys(index)) {
      try {
        const content = new File(bookDir(bookId), 'content.json');
        if (content.exists) {
          bundles.set(bookId, JSON.parse(await content.text()) as OfflineBundle);
        }
      } catch {
        // bundle corrompu : on l'ignore (il pourra être re-téléchargé)
      }
    }
  } catch {
    // premier lancement / dossier absent : rien à charger
  }
}

export function initOffline(): Promise<void> {
  if (!initPromise) initPromise = doInit();
  return initPromise;
}

// ---- consultation (utilisée par le repository avec cache) ----
export function isDownloaded(bookId: string): boolean {
  return bundles.has(bookId);
}
export function bundleForBook(bookId: string): OfflineBundle | null {
  return bundles.get(bookId) ?? null;
}
export function bundleForChapter(chapterId: string): OfflineBundle | null {
  for (const b of bundles.values()) {
    if (b.chapters.some((c) => c.id === chapterId)) return b;
  }
  return null;
}
export function downloadedBooks(): Book[] {
  return [...bundles.values()].map((b) => b.book);
}
export function downloadsList(): DownloadMeta[] {
  return Object.values(index).sort((a, b) => b.downloadedAt - a.downloadedAt);
}

// ---- écriture ----
function saveIndex(): void {
  const f = indexFile();
  if (!f.exists) f.create({ intermediates: true });
  f.write(JSON.stringify(index));
}

async function downloadMedia(url: string, dir: Directory, name: string): Promise<string> {
  const result = await File.downloadFileAsync(url, new File(dir, name), { idempotent: true });
  return result.uri;
}

export async function downloadBook(
  bookId: string,
  base: ContentRepository,
  onProgress?: (fraction: number) => void,
): Promise<void> {
  // 1) récupérer tout le contenu depuis la source (réseau)
  const book = await base.getBook(bookId);
  if (!book) throw new Error('Livre introuvable');
  const chapters = await base.getChapters(bookId);
  const lessons: Record<string, Lesson | null> = {};
  const questions: Record<string, Question[]> = {};
  for (const ch of chapters) {
    lessons[ch.id] = await base.getLesson(ch.id);
    questions[ch.id] = await base.getQuestions(ch.id);
  }

  // 2) compter les médias pour la progression
  let total = 0;
  if (book.coverUrl) total++;
  for (const ch of chapters) {
    const l = lessons[ch.id];
    if (l?.audioUrl) total++;
    if (l)
      for (const s of l.segments) {
        if (s.audioUrl) total++;
        if (s.translationAudio) total += Object.values(s.translationAudio).filter(Boolean).length;
      }
  }
  let done = 0;
  const tick = () => {
    done++;
    onProgress?.(total ? done / total : 1);
  };
  onProgress?.(total ? 0 : 1);

  // 3) préparer les dossiers
  const dir = bookDir(bookId);
  if (!dir.exists) dir.create({ intermediates: true });
  const audioDir = new Directory(dir, 'audio');
  if (!audioDir.exists) audioDir.create({ intermediates: true });

  // 4) télécharger la couverture (en secours : on garde l'URL distante)
  let coverUrl = book.coverUrl;
  if (book.coverUrl) {
    try {
      coverUrl = await downloadMedia(book.coverUrl, dir, `cover.${extFromUrl(book.coverUrl, 'jpg')}`);
    } catch {
      /* garde l'URL distante */
    }
    tick();
  }

  // 5) télécharger les audios (par chapitre et par segment), réécrire en local
  for (const ch of chapters) {
    const l = lessons[ch.id];
    if (!l) continue;
    if (l.audioUrl) {
      try {
        l.audioUrl = await downloadMedia(l.audioUrl, audioDir, `${safe(ch.id)}.${extFromUrl(l.audioUrl, 'mp3')}`);
      } catch {
        /* garde l'URL distante */
      }
      tick();
    }
    for (const s of l.segments) {
      if (s.audioUrl) {
        try {
          s.audioUrl = await downloadMedia(s.audioUrl, audioDir, `${safe(s.id)}.${extFromUrl(s.audioUrl, 'mp3')}`);
        } catch {
          /* garde l'URL distante */
        }
        tick();
      }
      if (s.translationAudio) {
        const map = s.translationAudio as Record<string, string>;
        for (const [loc, url] of Object.entries(map)) {
          if (!url) continue;
          try {
            map[loc] = await downloadMedia(url, audioDir, `${safe(s.id)}-${loc}.${extFromUrl(url, 'mp3')}`);
          } catch {
            /* garde l'URL distante */
          }
          tick();
        }
      }
    }
  }

  // 6) écrire le contenu figé + mettre à jour l'index et la mémoire
  const bundle: OfflineBundle = {
    version: BUNDLE_VERSION,
    book: { ...book, coverUrl },
    chapters,
    lessons,
    questions,
  };
  const content = new File(dir, 'content.json');
  if (!content.exists) content.create({ intermediates: true });
  content.write(JSON.stringify(bundle));

  bundles.set(bookId, bundle);
  index[bookId] = {
    bookId,
    title: book.title,
    downloadedAt: Date.now(),
    chapters: chapters.length,
  };
  saveIndex();
  onProgress?.(1);
  emit();
}

export async function removeBook(bookId: string): Promise<void> {
  try {
    const dir = bookDir(bookId);
    if (dir.exists) dir.delete();
  } catch {
    /* dossier déjà absent */
  }
  bundles.delete(bookId);
  delete index[bookId];
  saveIndex();
  emit();
}

// Démarre le chargement au plus tôt (le repository et le provider l'attendent).
void initOffline();
