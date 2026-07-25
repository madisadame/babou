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
}
