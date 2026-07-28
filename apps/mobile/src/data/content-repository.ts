import type { Book } from '@/domain/book';
import type { Chapter } from '@/domain/chapter';
import type { Lesson } from '@/domain/lesson';
import type { Question } from '@/domain/quiz';

import { createCachingRepository } from './caching-content-repository';
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
  getQuestions(chapterId: string): Promise<Question[]>;
}

// Sélection automatique : Supabase si les identifiants sont présents (voir
// .env), sinon le mock. Aucune interruption avant la configuration du backend.
export const baseContentRepository: ContentRepository = isSupabaseConfigured
  ? supabaseContentRepository
  : mockContentRepository;

// Le repository exposé aux écrans ajoute le mode hors-ligne par-dessus la
// source : contenu frais en ligne, lecture des livres téléchargés hors-ligne.
// Le téléchargement, lui, lit directement `baseContentRepository` (le réseau).
export const contentRepository: ContentRepository =
  createCachingRepository(baseContentRepository);
