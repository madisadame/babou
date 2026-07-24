import type { Book } from '@/types/book';

// Données fictives temporaires, en attendant l'espace administrateur (étape 5)
// et la connexion au backend (étape 6). Remplacer cet import par un appel réseau
// suffira à brancher les vraies données sans changer les écrans qui l'utilisent.
export const mockBooks: Book[] = [
  {
    id: '1',
    title: 'La Purification (Tahara)',
    description: 'Les règles des ablutions, du bain rituel et de la propreté en Islam.',
    coverUrl: 'https://picsum.photos/seed/babou-tahara/480/640',
  },
  {
    id: '2',
    title: 'La Prière (Salat)',
    description: 'Les conditions, les piliers et le déroulement de la prière quotidienne.',
    coverUrl: 'https://picsum.photos/seed/babou-salat/480/640',
  },
  {
    id: '3',
    title: 'Le Jeûne (Sawm)',
    description: "Les règles du jeûne du mois de Ramadan et ses cas d'exception.",
    coverUrl: 'https://picsum.photos/seed/babou-sawm/480/640',
  },
];
