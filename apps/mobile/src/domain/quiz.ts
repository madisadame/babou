import type { Translations } from '@/domain/lesson';

// Un choix de réponse : un identifiant stable + le libellé traduit.
export interface QuestionChoice {
  id: string;
  text: Translations;
}

// Une question de fin de chapitre. Énoncé, choix, bonne réponse et
// explication (correction) — tout traduit dans les langues disponibles.
export interface Question {
  id: string;
  chapterId: string;
  order: number;
  prompt: Translations;
  choices: QuestionChoice[];
  correctChoiceId: string;
  explanation: Translations;
}

// Mode d'affichage des corrections, choisi dans les réglages :
// - immediate : correction après chaque question
// - end       : toutes les corrections à la fin du questionnaire
export type CorrectionMode = 'immediate' | 'end';
