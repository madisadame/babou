import type { Book } from '@/domain/book';
import type { ContentRepository } from '@/data/content-repository';

import { mockBooks, mockChapters, mockLessons } from './mock-content';

function chapterCountOf(bookId: string): number {
  return mockChapters.filter((chapter) => chapter.bookId === bookId).length;
}

function toBook(raw: Omit<Book, 'chapterCount'>): Book {
  return { ...raw, chapterCount: chapterCountOf(raw.id) };
}

// Implémentation fictive (en mémoire). Utilisée tant que Supabase n'est pas
// configuré. À iso-interface avec l'implémentation Supabase.
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
