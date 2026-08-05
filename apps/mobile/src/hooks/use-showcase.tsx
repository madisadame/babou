import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { contentRepository } from '@/data/content-repository';

// Livre « vitrine » : ouvert à tous, même sans compte ni abonnement.
//
// La base applique déjà cette règle (politiques RLS + colonne `books.showcase`,
// cf. backend/2026-08-06-content-access.sql) : un visiteur sans accès ne reçoit
// que ce livre. Mais côté app, `AccessGate` renvoyait tout visiteur bloqué vers
// le paywall — la vitrine était donc inatteignable. Ce contexte lui dit quelles
// routes laisser passer.
//
// On mémorise aussi les chapitres des livres vitrine : la garde reçoit un
// identifiant de chapitre (`/chapter/xxx`) sans savoir à quel livre il
// appartient.

type ShowcaseContextValue = {
  /** Identifiants des livres vitrine. */
  bookIds: Set<string>;
  /** Identifiants des chapitres appartenant à un livre vitrine. */
  chapterIds: Set<string>;
  /** Vrai tant que la liste n'est pas connue (la garde doit attendre). */
  loading: boolean;
};

const EMPTY: ShowcaseContextValue = {
  bookIds: new Set(),
  chapterIds: new Set(),
  loading: false,
};

const ShowcaseContext = createContext<ShowcaseContextValue | null>(null);

export function ShowcaseProvider({ children }: { children: ReactNode }) {
  const [bookIds, setBookIds] = useState<Set<string>>(new Set());
  const [chapterIds, setChapterIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const books = await contentRepository.getBooks();
        const showcase = books.filter((b) => b.showcase);
        const chapterLists = await Promise.all(
          showcase.map((b) => contentRepository.getChapters(b.id).catch(() => [])),
        );
        if (cancelled) return;
        setBookIds(new Set(showcase.map((b) => b.id)));
        setChapterIds(new Set(chapterLists.flat().map((c) => c.id)));
      } catch {
        // Hors-ligne ou base injoignable : pas de vitrine connue. La garde se
        // comporte alors comme avant (tout le contenu mène au paywall).
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<ShowcaseContextValue>(
    () => ({ bookIds, chapterIds, loading }),
    [bookIds, chapterIds, loading],
  );

  return <ShowcaseContext.Provider value={value}>{children}</ShowcaseContext.Provider>;
}

// Tolérant à l'absence de provider (retourne une vitrine vide) : la garde ne
// doit jamais planter l'app si l'arbre de contextes change.
export function useShowcase(): ShowcaseContextValue {
  return useContext(ShowcaseContext) ?? EMPTY;
}
