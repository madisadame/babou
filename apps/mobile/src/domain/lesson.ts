import type { Locale } from '@/domain/locale';

// Traductions d'un texte, indexées par langue. Partielles : une langue
// manquante retombe sur le français à l'affichage (comme l'interface).
export type Translations = Partial<Record<Locale, string>>;

// Un mot du segment, avec timing optionnel dans l'audio. Prépare le suivi
// mot-à-mot (karaoké vidéo) : rempli plus tard, ignoré tant qu'absent.
export interface LessonWord {
  text: string;
  startMs?: number;
  endMs?: number;
}

// Un segment de leçon (une phrase / un verset) : le texte arabe, ses
// traductions, et — à terme — son découpage mot-à-mot et son audio.
// `audioUrl` = récitation coranique (arabe). `translationAudio` = audio de la
// traduction, par langue (fr / shimaoré), pour la lecture en paire.
export interface LessonSegment {
  id: string;
  arabic: string;
  translations: Translations;
  // Explication libre (par langue), pour un segment purement explicatif ou en
  // complément du texte. Optionnelle.
  explanations?: Translations;
  words?: LessonWord[];
  audioUrl?: string;
  translationAudio?: Partial<Record<Locale, string>>;
  // Audio de l'explication, par langue (fr / shimaoré). Optionnel.
  explanationAudio?: Partial<Record<Locale, string>>;
}

// La leçon d'un chapitre : une suite de segments. L'audio complet du chapitre
// pourra être fourni globalement (audioUrl) ou par segment.
export interface Lesson {
  chapterId: string;
  segments: LessonSegment[];
  audioUrl?: string;
}
