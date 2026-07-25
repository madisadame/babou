import type { Book } from '@/domain/book';
import type { Chapter } from '@/domain/chapter';
import type { Lesson } from '@/domain/lesson';

// Données fictives temporaires, en attendant l'espace d'administration (étape 5)
// et le backend Supabase (étape 7). Elles ne sont consommées QUE par le
// content-repository ; les écrans passent toujours par le repository, jamais
// par ce fichier directement. Le remplacer par des appels réseau suffira.

// Le nombre de chapitres est calculé par le repository ; on ne le stocke pas ici.
type MockBook = Omit<Book, 'chapterCount'>;

export const mockBooks: MockBook[] = [
  {
    id: 'safinat-an-naja',
    title: 'Safinat An-Naja',
    description: "Traité classique de fiqh Shâfi'î sur les actes d'adoration.",
    category: 'Fiqh',
    coverUrl: 'https://picsum.photos/seed/babou-safina/480/640',
  },
  {
    id: 'fiqh-du-quotidien',
    title: 'Le Fiqh du quotidien',
    description: 'Les règles pratiques des transactions et du comportement.',
    category: 'Fiqh',
    coverUrl: 'https://picsum.photos/seed/babou-quotidien/480/640',
  },
  {
    id: 'invocations-du-croyant',
    title: 'Invocations du croyant',
    description: 'Un recueil d’invocations pour rythmer les journées.',
    category: 'Invocations',
    coverUrl: 'https://picsum.photos/seed/babou-invocations/480/640',
  },
  {
    id: 'histoires-des-prophetes',
    title: 'Histoires des Prophètes',
    description: 'Les récits des prophètes et les enseignements qu’on en tire.',
    category: 'Histoires',
    coverUrl: 'https://picsum.photos/seed/babou-prophetes/480/640',
  },
];

export const mockChapters: Chapter[] = [
  // Safinat An-Naja — actes d'adoration
  {
    id: 'tahara',
    bookId: 'safinat-an-naja',
    order: 1,
    title: 'La Purification (Tahara)',
    description: 'Les règles des ablutions, du bain rituel et de la propreté.',
  },
  {
    id: 'salat',
    bookId: 'safinat-an-naja',
    order: 2,
    title: 'La Prière (Salat)',
    description: 'Les conditions, les piliers et le déroulement de la prière.',
  },
  {
    id: 'sawm',
    bookId: 'safinat-an-naja',
    order: 3,
    title: 'Le Jeûne (Sawm)',
    description: "Les règles du jeûne du Ramadan et ses cas d'exception.",
  },
  {
    id: 'zakat',
    bookId: 'safinat-an-naja',
    order: 4,
    title: "L'Aumône (Zakat)",
    description: 'Les seuils, les biens concernés et les bénéficiaires.',
  },
  {
    id: 'hajj',
    bookId: 'safinat-an-naja',
    order: 5,
    title: 'Le Pèlerinage (Hajj)',
    description: 'Les rites, les étapes et les conditions du pèlerinage.',
  },
  // Le Fiqh du quotidien — transactions et comportement
  {
    id: 'commerce',
    bookId: 'fiqh-du-quotidien',
    order: 1,
    title: 'Le Commerce (Bay‘)',
    description: 'Les règles du commerce licite et des transactions interdites.',
  },
  {
    id: 'mariage',
    bookId: 'fiqh-du-quotidien',
    order: 2,
    title: 'Le Mariage (Nikah)',
    description: 'Les conditions du mariage, le contrat et les droits des époux.',
  },
  {
    id: 'adab',
    bookId: 'fiqh-du-quotidien',
    order: 3,
    title: 'Les Bonnes Manières (Adab)',
    description: 'Les comportements du quotidien recommandés par la Sunna.',
  },
  // Invocations du croyant
  {
    id: 'dua-matin',
    bookId: 'invocations-du-croyant',
    order: 1,
    title: 'Invocations du matin',
    description: 'Les invocations à réciter au début de la journée.',
  },
  {
    id: 'dua-soir',
    bookId: 'invocations-du-croyant',
    order: 2,
    title: 'Invocations du soir',
    description: 'Les invocations à réciter en fin de journée.',
  },
  {
    id: 'dua-sommeil',
    bookId: 'invocations-du-croyant',
    order: 3,
    title: 'Avant de dormir',
    description: 'Les invocations recommandées avant le sommeil.',
  },
  // Histoires des Prophètes
  {
    id: 'prophete-adam',
    bookId: 'histoires-des-prophetes',
    order: 1,
    title: 'Le prophète Adam',
    description: 'Le récit de la création et des premiers enseignements.',
  },
  {
    id: 'prophete-nuh',
    bookId: 'histoires-des-prophetes',
    order: 2,
    title: 'Le prophète Nûh',
    description: 'Le récit du déluge et de la patience dans l’appel.',
  },
  {
    id: 'prophete-ibrahim',
    bookId: 'histoires-des-prophetes',
    order: 3,
    title: 'Le prophète Ibrahim',
    description: 'Le récit de la foi pure et de la construction de la Kaaba.',
  },
];

// Leçons d'exemple. Texte arabe NEUTRE (aucun contenu religieux) clairement
// signalé comme provisoire : le vrai contenu (avec audio et vidéo) viendra de
// l'admin (étape 5) et du backend (étape 7). Les chapitres sans leçon ici
// affichent un état « bientôt disponible ».
export const mockLessons: Lesson[] = [
  {
    chapterId: 'tahara',
    segments: [
      {
        id: 'tahara-1',
        arabic: 'هٰذَا نَصٌّ تَجْرِيبِيٌّ لِلْقِرَاءَةِ.',
        translations: { fr: "Ceci est un texte d'exemple pour la lecture." },
      },
      {
        id: 'tahara-2',
        arabic: 'سَيَحِلُّ مَحَلَّهُ الْمُحْتَوَى الْحَقِيقِيُّ قَرِيبًا.',
        translations: { fr: 'Le contenu réel le remplacera prochainement.' },
      },
      {
        id: 'tahara-3',
        arabic: 'كُلُّ فَصْلٍ سَيَحْتَوِي عَلَى النَّصِّ وَتَرْجَمَتِهِ.',
        translations: { fr: 'Chaque chapitre contiendra le texte et sa traduction.' },
      },
    ],
  },
  {
    chapterId: 'salat',
    segments: [
      {
        id: 'salat-1',
        arabic: 'هٰذِهِ مُعَايَنَةٌ لِلْقَارِئِ الثُّنَائِيِّ اللُّغَةِ.',
        translations: { fr: 'Ceci est un aperçu du lecteur bilingue.' },
      },
      {
        id: 'salat-2',
        arabic: 'النَّصُّ الْعَرَبِيُّ فِي الْأَعْلَى وَالتَّرْجَمَةُ تَحْتَهُ.',
        translations: { fr: "Le texte arabe en haut et la traduction en dessous." },
      },
    ],
  },
];

