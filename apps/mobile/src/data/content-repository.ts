import type { Book } from '@/domain/book';
import type { Chapter } from '@/domain/chapter';
import type { Lesson } from '@/domain/lesson';

import { mockContentRepository } from './mock/mock-content-repository';
import { isSupabaseConfigured } from './supabase/client';
import { supabaseContentRepository } from './supabase/supabase-content-repository';

// Contrat d'accès au contenu. Asynchrone : les écrans ne dépendent pas de la
// source (mock ou Supabase). Ajouter une source = fournir cette interface.
export interface ContentRepository {
  getBooks(): Promise<Book[]>;
  getBook(id: string): Promise<Book | null>;
  getChapters(bookId: string): Promise<Chapter[]>;
  getChapter(id: string): Promise<Chapter | null>;
  getLesson(chapterId: string): Promise<Lesson | null>;
}

// Sélection automatique : Supabase si les identifiants sont présents (voir
// .env), sinon le mock. Aucune interruption avant la configuration du backend.
export const contentRepository: ContentRepository = isSupabaseConfigured
  ? supabaseContentRepository
  : mockContentRepository;
