import type { Book } from '@/domain/book';
import type { Chapter } from '@/domain/chapter';
import type { Lesson } from '@/domain/lesson';

import { mockBooks, mockChapters, mockLessons } from './mock/mock-content';

// Contrat d'accès au contenu. Asynchrone volontairement : le jour du backend
// (Supabase), seule l'implémentation change — l'interface et les écrans qui la
// consomment restent identiques.
export interface ContentRepository {
  getBooks(): Promise<Book[]>;
  getBook(id: string): Promise<Book | null>;
  getChapters(bookId: string): Promise<Chapter[]>;
  getChapter(id: string): Promise<Chapter | null>;
  getLesson(chapterId: string): Promise<Lesson | null>;
}

function chapterCountOf(bookId: string): number {
  return mockChapters.filter((chapter) => chapter.bookId === bookId).length;
}

function toBook(raw: Omit<Book, 'chapterCount'>): Book {
  return { ...raw, chapterCount: chapterCountOf(raw.id) };
}

// Implémentation fictive (en mémoire). À remplacer par une implémentation
// Supabase sans toucher aux écrans.
export const mockContentRepository: ContentRepository = {
  async getBooks() {
    return mockBooks.map(toBook);
  },

  async getBook(id) {
    const raw = mockBooks.find((book) => book.id === id);
    return raw ? toBook(raw) : null;
  },

  async getChapters(bookId) {
    return mockChapters
      .filter((chapter) => chapter.bookId === bookId)
      .sort((a, b) => a.order - b.order);
  },

  async getChapter(id) {
    return mockChapters.find((chapter) => chapter.id === id) ?? null;
  },

  async getLesson(chapterId) {
    return mockLessons.find((lesson) => lesson.chapterId === chapterId) ?? null;
  },
};

// Point d'accès unique. Les écrans passent par les hooks (features/content),
// qui utilisent ce repository. Changer cette ligne suffira à basculer sur le
// backend.
export const contentRepository: ContentRepository = mockContentRepository;
