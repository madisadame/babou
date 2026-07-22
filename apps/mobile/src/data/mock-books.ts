import type { Book } from '@/types/book';

// Données fictives temporaires, en attendant l'espace administrateur (étape 5)
// et la connexion au backend (étape 6). Remplacer cet import par un appel réseau
// suffira à brancher les vraies données sans changer les écrans qui l'utilisent.
export const mockBooks: Book[] = [
  {
    id: '1',
    title: 'La Purification (Tahara)',
    description: 'Les règles des ablutions, du bain rituel et de la propreté en Islam.',
  },
  {
    id: '2',
    title: 'La Prière (Salat)',
    description: 'Les conditions, les piliers et le déroulement de la prière quotidienne.',
  },
  {
    id: '3',
    title: 'Le Jeûne (Sawm)',
    description: "Les règles du jeûne du mois de Ramadan et ses cas d'exception.",
  },
];
