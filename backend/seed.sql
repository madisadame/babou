-- Données initiales Babou (miroir du contenu mock).
-- À exécuter APRÈS schema.sql, dans l'éditeur SQL de Supabase. Idempotent.
-- Les valeurs texte utilisent le dollar-quoting ($b$...$b$) : aucune
-- apostrophe à échapper, robuste au copier-coller.

-- Livres
insert into public.books (id, title, description, category, cover_url, position) values
  ('safinat-an-naja', $b$Safinat An-Naja$b$, $b$Traité classique de fiqh Shâfi'î sur les actes d'adoration.$b$, 'Fiqh', 'https://picsum.photos/seed/babou-safina/480/640', 1),
  ('fiqh-du-quotidien', $b$Le Fiqh du quotidien$b$, $b$Les règles pratiques des transactions et du comportement.$b$, 'Fiqh', 'https://picsum.photos/seed/babou-quotidien/480/640', 2),
  ('invocations-du-croyant', $b$Invocations du croyant$b$, $b$Un recueil d'invocations pour rythmer les journées.$b$, 'Invocations', 'https://picsum.photos/seed/babou-invocations/480/640', 3),
  ('histoires-des-prophetes', $b$Histoires des Prophètes$b$, $b$Les récits des prophètes et les enseignements qu'on en tire.$b$, 'Histoires', 'https://picsum.photos/seed/babou-prophetes/480/640', 4)
on conflict (id) do nothing;

-- Chapitres
insert into public.chapters (id, book_id, position, title, description) values
  ('tahara', 'safinat-an-naja', 1, $b$La Purification (Tahara)$b$, $b$Les règles des ablutions, du bain rituel et de la propreté.$b$),
  ('salat', 'safinat-an-naja', 2, $b$La Prière (Salat)$b$, $b$Les conditions, les piliers et le déroulement de la prière.$b$),
  ('sawm', 'safinat-an-naja', 3, $b$Le Jeûne (Sawm)$b$, $b$Les règles du jeûne du Ramadan et ses cas d'exception.$b$),
  ('zakat', 'safinat-an-naja', 4, $b$L'Aumône (Zakat)$b$, $b$Les seuils, les biens concernés et les bénéficiaires.$b$),
  ('hajj', 'safinat-an-naja', 5, $b$Le Pèlerinage (Hajj)$b$, $b$Les rites, les étapes et les conditions du pèlerinage.$b$),
  ('commerce', 'fiqh-du-quotidien', 1, $b$Le Commerce (Bay')$b$, $b$Les règles du commerce licite et des transactions interdites.$b$),
  ('mariage', 'fiqh-du-quotidien', 2, $b$Le Mariage (Nikah)$b$, $b$Les conditions du mariage, le contrat et les droits des époux.$b$),
  ('adab', 'fiqh-du-quotidien', 3, $b$Les Bonnes Manières (Adab)$b$, $b$Les comportements du quotidien recommandés par la Sunna.$b$),
  ('dua-matin', 'invocations-du-croyant', 1, $b$Invocations du matin$b$, $b$Les invocations à réciter au début de la journée.$b$),
  ('dua-soir', 'invocations-du-croyant', 2, $b$Invocations du soir$b$, $b$Les invocations à réciter en fin de journée.$b$),
  ('dua-sommeil', 'invocations-du-croyant', 3, $b$Avant de dormir$b$, $b$Les invocations recommandées avant le sommeil.$b$),
  ('prophete-adam', 'histoires-des-prophetes', 1, $b$Le prophète Adam$b$, $b$Le récit de la création et des premiers enseignements.$b$),
  ('prophete-nuh', 'histoires-des-prophetes', 2, $b$Le prophète Nûh$b$, $b$Le récit du déluge et de la patience dans l'appel.$b$),
  ('prophete-ibrahim', 'histoires-des-prophetes', 3, $b$Le prophète Ibrahim$b$, $b$Le récit de la foi pure et de la construction de la Kaaba.$b$)
on conflict (id) do nothing;

-- Segments de leçon (texte arabe NEUTRE d'exemple + traduction française)
insert into public.chapter_segments (id, chapter_id, position, arabic, translation_fr) values
  ('tahara-1', 'tahara', 1, $b$هٰذَا نَصٌّ تَجْرِيبِيٌّ لِلْقِرَاءَةِ.$b$, $b$Ceci est un texte d'exemple pour la lecture.$b$),
  ('tahara-2', 'tahara', 2, $b$سَيَحِلُّ مَحَلَّهُ الْمُحْتَوَى الْحَقِيقِيُّ قَرِيبًا.$b$, $b$Le contenu réel le remplacera prochainement.$b$),
  ('tahara-3', 'tahara', 3, $b$كُلُّ فَصْلٍ سَيَحْتَوِي عَلَى النَّصِّ وَتَرْجَمَتِهِ.$b$, $b$Chaque chapitre contiendra le texte et sa traduction.$b$),
  ('salat-1', 'salat', 1, $b$هٰذِهِ مُعَايَنَةٌ لِلْقَارِئِ الثُّنَائِيِّ اللُّغَةِ.$b$, $b$Ceci est un aperçu du lecteur bilingue.$b$),
  ('salat-2', 'salat', 2, $b$النَّصُّ الْعَرَبِيُّ فِي الْأَعْلَى وَالتَّرْجَمَةُ تَحْتَهُ.$b$, $b$Le texte arabe en haut et la traduction en dessous.$b$)
on conflict (id) do nothing;

-- Questions d'exemple NEUTRES (démontrent le mécanisme du quiz)
insert into public.questions (id, chapter_id, position, prompt_fr, correct_choice_key, explanation_fr) values
  ('quiz-tahara-1', 'tahara', 1, $b$Question d'exemple : quelle option est la bonne réponse ?$b$, 'b', $b$Correction d'exemple : la bonne réponse était « Option B ».$b$),
  ('quiz-tahara-2', 'tahara', 2, $b$Question d'exemple : combien font 2 + 3 ?$b$, 'b', $b$2 + 3 = 5.$b$),
  ('quiz-tahara-3', 'tahara', 3, $b$Vrai ou faux (exemple) : Babou est un outil de complément.$b$, 'a', $b$Babou est bien un outil pédagogique de complément.$b$),
  ('quiz-salat-1', 'salat', 1, $b$Question d'exemple : que montre le lecteur d'un chapitre ?$b$, 'a', $b$Le lecteur affiche le texte arabe et sa traduction.$b$),
  ('quiz-salat-2', 'salat', 2, $b$Question d'exemple : combien font 10 − 4 ?$b$, 'b', $b$10 − 4 = 6.$b$)
on conflict (id) do nothing;

insert into public.question_choices (id, question_id, position, choice_key, text_fr) values
  ('quiz-tahara-1-a', 'quiz-tahara-1', 1, 'a', $b$Option A$b$),
  ('quiz-tahara-1-b', 'quiz-tahara-1', 2, 'b', $b$Option B$b$),
  ('quiz-tahara-1-c', 'quiz-tahara-1', 3, 'c', $b$Option C$b$),
  ('quiz-tahara-2-a', 'quiz-tahara-2', 1, 'a', $b$4$b$),
  ('quiz-tahara-2-b', 'quiz-tahara-2', 2, 'b', $b$5$b$),
  ('quiz-tahara-2-c', 'quiz-tahara-2', 3, 'c', $b$6$b$),
  ('quiz-tahara-3-a', 'quiz-tahara-3', 1, 'a', $b$Vrai$b$),
  ('quiz-tahara-3-b', 'quiz-tahara-3', 2, 'b', $b$Faux$b$),
  ('quiz-salat-1-a', 'quiz-salat-1', 1, 'a', $b$Le texte arabe et sa traduction$b$),
  ('quiz-salat-1-b', 'quiz-salat-1', 2, 'b', $b$Uniquement une image$b$),
  ('quiz-salat-2-a', 'quiz-salat-2', 1, 'a', $b$5$b$),
  ('quiz-salat-2-b', 'quiz-salat-2', 2, 'b', $b$6$b$),
  ('quiz-salat-2-c', 'quiz-salat-2', 3, 'c', $b$7$b$)
on conflict (id) do nothing;
