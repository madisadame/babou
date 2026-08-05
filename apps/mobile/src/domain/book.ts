// Type métier pur : un ouvrage de la bibliothèque (ex. « Safinat An-Naja »).
// Un livre regroupe plusieurs chapitres (voir Chapter). Aucune dépendance à
// la source de données : mock aujourd'hui, backend (Supabase) demain.
export interface Book {
  id: string;
  title: string;
  description: string;
  /** Type d'ouvrage (Fiqh, Invocations, Histoires…). Sert au filtre. */
  category: string;
  coverUrl?: string;
  /** Ordre d'affichage dans la bibliothèque. */
  position: number;
  /** Nombre de chapitres — dénormalisé pour l'affichage en liste. */
  chapterCount: number;
  /** Publié (visible du public) ou brouillon (visible des seuls admins). */
  published?: boolean;
  /**
   * Livre « vitrine » : lisible sans compte ni abonnement. Sert de porte
   * d'entrée aux visiteurs. La base applique la même règle (colonne
   * `books.showcase`, cf. backend/2026-08-06-content-access.sql) — ici c'est
   * la navigation qui s'y conforme.
   */
  showcase?: boolean;
}
