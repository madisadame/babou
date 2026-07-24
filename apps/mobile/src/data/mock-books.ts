import type { Book } from '@/types/book';

// Données fictives temporaires, en attendant l'espace administrateur (étape 5)
// et la connexion au backend (étape 6). Remplacer cet import par un appel réseau
// suffira à brancher les vraies données sans changer les écrans qui l'utilisent.
export const mockBooks: Book[] = [
  {
    id: '1',
    title: 'La Purification (Tahara)',
    description: 'Les règles des ablutions, du bain rituel et de la propreté en Islam.',
    category: 'Adorations',
    coverUrl: 'https://picsum.photos/seed/babou-tahara/480/640',
  },
  {
    id: '2',
    title: 'La Prière (Salat)',
    description: 'Les conditions, les piliers et le déroulement de la prière quotidienne.',
    category: 'Adorations',
    coverUrl: 'https://picsum.photos/seed/babou-salat/480/640',
  },
  {
    id: '3',
    title: 'Le Jeûne (Sawm)',
    description: "Les règles du jeûne du mois de Ramadan et ses cas d'exception.",
    category: 'Adorations',
    coverUrl: 'https://picsum.photos/seed/babou-sawm/480/640',
  },
  {
    id: '4',
    title: "L'Aumône (Zakat)",
    description: 'Les seuils, les biens concernés et les bénéficiaires de la zakat.',
    category: 'Adorations',
    coverUrl: 'https://picsum.photos/seed/babou-zakat/480/640',
  },
  {
    id: '5',
    title: 'Le Pèlerinage (Hajj)',
    description: 'Les rites, les étapes et les conditions du pèlerinage à La Mecque.',
    category: 'Adorations',
    coverUrl: 'https://picsum.photos/seed/babou-hajj/480/640',
  },
  {
    id: '6',
    title: 'Le Commerce (Bay‘)',
    description: 'Les règles du commerce licite : ventes, contrats et transactions interdites.',
    category: 'Transactions',
    coverUrl: 'https://picsum.photos/seed/babou-commerce/480/640',
  },
  {
    id: '7',
    title: 'Le Mariage (Nikah)',
    description: 'Les conditions du mariage, le contrat et les droits des époux.',
    category: 'Transactions',
    coverUrl: 'https://picsum.photos/seed/babou-mariage/480/640',
  },
  {
    id: '8',
    title: 'Les Bonnes Manières (Adab)',
    description: 'Les comportements du quotidien recommandés par la Sunna.',
    category: 'Comportement',
    coverUrl: 'https://picsum.photos/seed/babou-adab/480/640',
  },
];
