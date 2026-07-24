// Type métier pur : un chapitre appartenant à un livre.
// Portera plus tard la leçon (texte arabe + traductions + audio/vidéo) et le
// quiz de fin de chapitre. Découplé de la source de données.
export interface Chapter {
  id: string;
  bookId: string;
  /** Ordre d'affichage au sein du livre. */
  order: number;
  title: string;
  description: string;
}
