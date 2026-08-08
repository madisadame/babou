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
// hors-ligne. Stratégie : on privilégie TOUJOURS la source (réseau) quand elle
// répond ; on bascule sur le contenu téléchargé quand elle échoue.
//
// Règle importante : si la source échoue ET qu'aucun contenu téléchargé ne
// peut prendre le relais, **l'erreur est propagée**. Auparavant elle était
// avalée et transformée en résultat vide, si bien qu'une panne réseau
// s'affichait à l'utilisateur comme « Aucun livre » — indiscernable d'un
// catalogue réellement vide. Les écrans peuvent désormais distinguer les deux.

// Exécute l'appel réseau ; en cas d'échec, se rabat sur le contenu hors-ligne
// s'il existe, sinon relaie l'erreur.
async function reseauPuisHorsLigne<T>(
  appel: () => Promise<T>,
  horsLigne: () => T | null,
): Promise<T> {
  try {
    return await appel();
  } catch (erreur) {
    const local = horsLigne();
    if (local !== null) return local;
    throw erreur;
  }
}

export function createCachingRepository(base: ContentRepository): ContentRepository {
  return {
    async getBooks(): Promise<Book[]> {
      const telecharges = downloadedBooks();
      try {
        const net = await base.getBooks();
        // Union : les livres téléchargés apparaissent toujours (même hors-ligne),
        // le réseau prime pour ceux qu'il renvoie.
        const byId = new Map<string, Book>();
        for (const b of telecharges) byId.set(b.id, b);
        for (const b of net) byId.set(b.id, b);
        return [...byId.values()].sort((a, b) => a.position - b.position);
      } catch (erreur) {
        if (telecharges.length) {
          return [...telecharges].sort((a, b) => a.position - b.position);
        }
        throw erreur;
      }
    },

    async getBook(id: string): Promise<Book | null> {
      const b = await reseauPuisHorsLigne(
        () => base.getBook(id),
        () => bundleForBook(id)?.book ?? null,
      );
      return b ?? bundleForBook(id)?.book ?? null;
    },

    async getChapters(bookId: string): Promise<Chapter[]> {
      const cs = await reseauPuisHorsLigne(
        () => base.getChapters(bookId),
        () => bundleForBook(bookId)?.chapters ?? null,
      );
      if (cs.length) return cs;
      return bundleForBook(bookId)?.chapters ?? [];
    },

    async getChapter(id: string): Promise<Chapter | null> {
      const c = await reseauPuisHorsLigne(
        () => base.getChapter(id),
        () => bundleForChapter(id)?.chapters.find((ch) => ch.id === id) ?? null,
      );
      return c ?? bundleForChapter(id)?.chapters.find((ch) => ch.id === id) ?? null;
    },

    async getLesson(chapterId: string): Promise<Lesson | null> {
      const l = await reseauPuisHorsLigne(
        () => base.getLesson(chapterId),
        () => bundleForChapter(chapterId)?.lessons[chapterId] ?? null,
      );
      return l ?? bundleForChapter(chapterId)?.lessons[chapterId] ?? null;
    },

    async getQuestions(chapterId: string): Promise<Question[]> {
      const q = await reseauPuisHorsLigne(
        () => base.getQuestions(chapterId),
        () => bundleForChapter(chapterId)?.questions[chapterId] ?? null,
      );
      if (q.length) return q;
      return bundleForChapter(chapterId)?.questions[chapterId] ?? [];
    },
  };
}
