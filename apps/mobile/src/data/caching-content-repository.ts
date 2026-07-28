import type { Book } from '@/domain/book';
import type { Chapter } from '@/domain/chapter';
import type { Lesson } from '@/domain/lesson';
import type { Question } from '@/domain/quiz';
import type { ContentRepository } from '@/data/content-repository';
import {
  bundleForBook,
  bundleForChapter,
  downloadedBooks,
} from '@/data/offline-store';

// Enveloppe le repository de base (mock ou Supabase) pour ajouter le mode
// hors-ligne. Stratégie : on privilégie TOUJOURS la source (réseau) quand
// elle répond ; on ne bascule sur le contenu téléchargé QUE lorsque la source
// ne renvoie rien (hors connexion). Résultat : contenu frais en ligne (aucune
// péremption, rien à changer côté admin), et lecture possible hors-ligne pour
// les livres téléchargés. Le repository Supabase ne lève pas d'erreur : il
// renvoie un résultat vide en cas d'échec — d'où le repli « si vide ».

async function tryBase<T>(call: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await call();
  } catch {
    return fallback;
  }
}

export function createCachingRepository(base: ContentRepository): ContentRepository {
  return {
    async getBooks(): Promise<Book[]> {
      const net = await tryBase(() => base.getBooks(), [] as Book[]);
      // Union : les livres téléchargés apparaissent toujours (même hors-ligne),
      // le réseau prime pour ceux qu'il renvoie.
      const byId = new Map<string, Book>();
      for (const b of downloadedBooks()) byId.set(b.id, b);
      for (const b of net) byId.set(b.id, b);
      return [...byId.values()].sort((a, b) => a.position - b.position);
    },

    async getBook(id: string): Promise<Book | null> {
      const b = await tryBase(() => base.getBook(id), null);
      if (b) return b;
      return bundleForBook(id)?.book ?? null;
    },

    async getChapters(bookId: string): Promise<Chapter[]> {
      const cs = await tryBase(() => base.getChapters(bookId), [] as Chapter[]);
      if (cs.length) return cs;
      return bundleForBook(bookId)?.chapters ?? [];
    },

    async getChapter(id: string): Promise<Chapter | null> {
      const c = await tryBase(() => base.getChapter(id), null);
      if (c) return c;
      return bundleForChapter(id)?.chapters.find((ch) => ch.id === id) ?? null;
    },

    async getLesson(chapterId: string): Promise<Lesson | null> {
      const l = await tryBase(() => base.getLesson(chapterId), null);
      if (l) return l;
      return bundleForChapter(chapterId)?.lessons[chapterId] ?? null;
    },

    async getQuestions(chapterId: string): Promise<Question[]> {
      const q = await tryBase(() => base.getQuestions(chapterId), [] as Question[]);
      if (q.length) return q;
      return bundleForChapter(chapterId)?.questions[chapterId] ?? [];
    },
  };
}
