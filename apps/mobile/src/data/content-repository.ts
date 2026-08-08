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

// Repository de dernier recours : refuse toute lecture avec une erreur
// explicite. Sert UNIQUEMENT en production quand la configuration Supabase est
// absente. Livrer les données fictives dans ce cas serait bien pire qu'une
// erreur : l'app afficherait des livres inventés, des images `picsum.photos` et
// un fichier audio de démonstration, sans que rien ne signale l'anomalie.
function createUnconfiguredRepository(): ContentRepository {
  const refuser = (): never => {
    throw new Error(
      'Configuration Supabase absente : EXPO_PUBLIC_SUPABASE_URL et ' +
        'EXPO_PUBLIC_SUPABASE_ANON_KEY doivent être fournies au build ' +
        '(profil EAS ou .env).',
    );
  };
  return {
    getBooks: refuser,
    getBook: refuser,
    getChapters: refuser,
    getChapter: refuser,
    getLesson: refuser,
    getQuestions: refuser,
  };
}

// Sélection de la source :
//   - identifiants présents  → Supabase ;
//   - absents en DÉVELOPPEMENT → mock, pour travailler sans backend ;
//   - absents en PRODUCTION  → erreur explicite, jamais de données fictives.
export const baseContentRepository: ContentRepository = isSupabaseConfigured
  ? supabaseContentRepository
  : __DEV__
    ? mockContentRepository
    : createUnconfiguredRepository();

// Le repository exposé aux écrans ajoute le mode hors-ligne par-dessus la
// source : contenu frais en ligne, lecture des livres téléchargés hors-ligne.
// Le téléchargement, lui, lit directement `baseContentRepository` (le réseau).
export const contentRepository: ContentRepository =
  createCachingRepository(baseContentRepository);
