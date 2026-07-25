// Dictionnaire français — source de vérité des clés d'interface.
// Le type des clés (TranslationKey) est dérivé de cet objet : toute clé
// utilisée dans l'app doit exister ici. Interpolation via {{nom}}.
export const fr = {
  // Commun
  'common.back': 'Retour',
  'common.loading': 'Chargement…',
  'common.cancel': 'Annuler',

  // Langues
  'language.label': 'Langue',
  'language.fr': 'Français',
  'language.shimaore': 'Shimaoré',

  // Accueil
  'home.title': 'Bienvenue sur Babou',
  'home.intro.p1':
    "Babou est un outil pédagogique conçu pour t'accompagner dans l'apprentissage et la révision de ta religion, en particulier lorsque tu n'as pas toujours la possibilité d'assister à des cours.",
  'home.intro.p2':
    "Cette application ne remplace en aucun cas les enseignants, les imams, les professeurs et les gens de science. Elle est pensée comme un complément d'apprentissage, et non comme une référence unique : rien ne saurait se substituer à l'enseignement transmis par des personnes qualifiées.",
  'home.intro.p3':
    "Il existe plusieurs écoles juridiques (madhahib) reconnues, ainsi que des personnes qui choisissent de ne suivre aucune école en particulier. Le contenu de Babou s'appuie principalement sur la méthodologie de l'école de l'Imam Ash-Shâfi'î, car c'est cet enseignement que l'application a vocation à transmettre.",
  'home.intro.p4':
    "Ce choix n'a pas pour but de critiquer les autres approches, toutes dignes de respect, mais simplement d'annoncer clairement le cadre dans lequel Babou a été conçu, afin d'éviter toute ambiguïté.",
  'home.invocation': "Qu'Allah facilite ton apprentissage et t'accorde la science utile.",
  'home.cta': 'Accéder à la bibliothèque',

  // Bibliothèque
  'library.title': 'Bibliothèque',
  'library.subtitle': 'Choisis un livre pour commencer à apprendre.',
  'library.searchPlaceholder': 'Rechercher un livre…',
  'library.categoryAll': 'Toutes',
  'library.sortAsc': 'Titre A → Z',
  'library.sortDesc': 'Titre Z → A',
  'library.emptySearch': 'Aucun livre ne correspond à « {{query}} ».',
  'library.emptyCategory': 'Aucun livre dans cette catégorie.',
  'library.resetAll': 'Réinitialiser toute la progression',
  'library.resetAllTitle': 'Réinitialiser toute la progression',
  'library.resetAllMessage':
    'La progression de lecture de tous les chapitres sera effacée. Continuer ?',
  'library.resetAllConfirm': 'Tout réinitialiser',

  // Livre (carte + fiche)
  'book.chapterCountOne': '{{count}} chapitre',
  'book.chapterCountOther': '{{count}} chapitres',
  'book.chapterLabelOne': '{{count}} CHAPITRE',
  'book.chapterLabelOther': '{{count}} CHAPITRES',
  'book.categoryA11y': 'Voir tous les livres de la catégorie {{category}}',
  'book.coverOpenA11y': 'Agrandir la couverture',
  'book.coverClose': 'Toucher pour fermer',
  'book.notFoundTitle': 'Livre introuvable',
  'book.notFoundMessage': "Ce livre n'existe pas ou n'est plus disponible.",
  'book.chaptersEmpty': 'Aucun chapitre pour le moment.',

  // Chapitre (lecture)
  'chapter.label': 'Chapitre {{order}}',
  'chapter.meta': 'Chapitre {{order}} · {{pct}} % lu',
  'chapter.lessonPending': 'Le contenu de ce chapitre sera bientôt disponible.',
  'chapter.mediaSoon': 'Vidéo avec suivi des mots : bientôt disponible.',
  'chapter.sampleNoticeTitle': "Texte d'exemple",
  'audio.play': "Lire l'audio",
  'audio.pause': 'Mettre en pause',
  'chapter.sampleNoticeBody':
    "Le contenu pédagogique complet de ce chapitre sera ajouté depuis l'espace d'administration (étape 5) puis servi par le backend (étape 7).",
  'chapter.reset': 'Réinitialiser la progression',
  'chapter.resetTitle': 'Réinitialiser la progression',
  'chapter.resetMessage': 'Ta progression de lecture pour ce chapitre sera effacée. Continuer ?',
  'chapter.resetConfirm': 'Réinitialiser',
  'chapter.notFoundTitle': 'Chapitre introuvable',
  'chapter.notFoundMessage': "Ce chapitre n'existe pas ou n'est plus disponible.",
  'chapter.startQuiz': 'Passer le quiz',

  // Réglages
  'settings.title': 'Réglages',
  'settings.a11y': 'Ouvrir les réglages',
  'settings.languageSection': 'Langue',
  'settings.correctionSection': 'Correction des quiz',
  'settings.correctionImmediate': 'Après chaque question',
  'settings.correctionEnd': 'À la fin du questionnaire',

  // Quiz
  'quiz.progress': 'Question {{current}} / {{total}}',
  'quiz.next': 'Question suivante',
  'quiz.seeResults': 'Voir les résultats',
  'quiz.correct': 'Bonne réponse',
  'quiz.incorrect': 'Mauvaise réponse',
  'quiz.correctionLabel': 'Correction',
  'quiz.empty': 'Aucune question pour ce chapitre pour le moment.',
  'quiz.resultsTitle': 'Résultats',
  'quiz.resultsScore': '{{correct}} / {{total}} bonnes réponses',
  'quiz.resultsRate': 'Taux de réussite : {{pct}} %',
  'quiz.resultsMastered': 'Questions réussies : {{count}}',
  'quiz.resultsToReview': 'Questions à revoir : {{count}}',
  'quiz.reviewTitle': 'Corrections',
  'quiz.correctAnswer': 'Bonne réponse : {{answer}}',
  'quiz.retry': 'Recommencer',
  'quiz.backToChapter': 'Retour au chapitre',
} as const;
