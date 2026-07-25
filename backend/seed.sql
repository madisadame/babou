-- Données initiales Babou (miroir du contenu mock).
-- À exécuter APRÈS schema.sql, dans l'éditeur SQL de Supabase. Idempotent.

-- Livres
insert into public.books (id, title, description, category, cover_url, position) values
  ('safinat-an-naja', 'Safinat An-Naja', 'Traité classique de fiqh Shâfi''î sur les actes d''adoration.', 'Fiqh', 'https://picsum.photos/seed/babou-safina/480/640', 1),
  ('fiqh-du-quotidien', 'Le Fiqh du quotidien', 'Les règles pratiques des transactions et du comportement.', 'Fiqh', 'https://picsum.photos/seed/babou-quotidien/480/640', 2),
  ('invocations-du-croyant', 'Invocations du croyant', 'Un recueil d''invocations pour rythmer les journées.', 'Invocations', 'https://picsum.photos/seed/babou-invocations/480/640', 3),
  ('histoires-des-prophetes', 'Histoires des Prophètes', 'Les récits des prophètes et les enseignements qu''on en tire.', 'Histoires', 'https://picsum.photos/seed/babou-prophetes/480/640', 4)
on conflict (id) do nothing;

-- Chapitres
insert into public.chapters (id, book_id, position, title, description) values
  ('tahara', 'safinat-an-naja', 1, 'La Purification (Tahara)', 'Les règles des ablutions, du bain rituel et de la propreté.'),
  ('salat', 'safinat-an-naja', 2, 'La Prière (Salat)', 'Les conditions, les piliers et le déroulement de la prière.'),
  ('sawm', 'safinat-an-naja', 3, 'Le Jeûne (Sawm)', 'Les règles du jeûne du Ramadan et ses cas d''exception.'),
  ('zakat', 'safinat-an-naja', 4, 'L''Aumône (Zakat)', 'Les seuils, les biens concernés et les bénéficiaires.'),
  ('hajj', 'safinat-an-naja', 5, 'Le Pèlerinage (Hajj)', 'Les rites, les étapes et les conditions du pèlerinage.'),
  ('commerce', 'fiqh-du-quotidien', 1, 'Le Commerce (Bay‘)', 'Les règles du commerce licite et des transactions interdites.'),
  ('mariage', 'fiqh-du-quotidien', 2, 'Le Mariage (Nikah)', 'Les conditions du mariage, le contrat et les droits des époux.'),
  ('adab', 'fiqh-du-quotidien', 3, 'Les Bonnes Manières (Adab)', 'Les comportements du quotidien recommandés par la Sunna.'),
  ('dua-matin', 'invocations-du-croyant', 1, 'Invocations du matin', 'Les invocations à réciter au début de la journée.'),
  ('dua-soir', 'invocations-du-croyant', 2, 'Invocations du soir', 'Les invocations à réciter en fin de journée.'),
  ('dua-sommeil', 'invocations-du-croyant', 3, 'Avant de dormir', 'Les invocations recommandées avant le sommeil.'),
  ('prophete-adam', 'histoires-des-prophetes', 1, 'Le prophète Adam', 'Le récit de la création et des premiers enseignements.'),
  ('prophete-nuh', 'histoires-des-prophetes', 2, 'Le prophète Nûh', 'Le récit du déluge et de la patience dans l''appel.'),
  ('prophete-ibrahim', 'histoires-des-prophetes', 3, 'Le prophète Ibrahim', 'Le récit de la foi pure et de la construction de la Kaaba.')
on conflict (id) do nothing;

-- Segments de leçon (texte arabe NEUTRE d'exemple + traduction française)
insert into public.chapter_segments (id, chapter_id, position, arabic, translation_fr) values
  ('tahara-1', 'tahara', 1, 'هٰذَا نَصٌّ تَجْرِيبِيٌّ لِلْقِرَاءَةِ.', 'Ceci est un texte d''exemple pour la lecture.'),
  ('tahara-2', 'tahara', 2, 'سَيَحِلُّ مَحَلَّهُ الْمُحْتَوَى الْحَقِيقِيُّ قَرِيبًا.', 'Le contenu réel le remplacera prochainement.'),
  ('tahara-3', 'tahara', 3, 'كُلُّ فَصْلٍ سَيَحْتَوِي عَلَى النَّصِّ وَتَرْجَمَتِهِ.', 'Chaque chapitre contiendra le texte et sa traduction.'),
  ('salat-1', 'salat', 1, 'هٰذِهِ مُعَايَنَةٌ لِلْقَارِئِ الثُّنَائِيِّ اللُّغَةِ.', 'Ceci est un aperçu du lecteur bilingue.'),
  ('salat-2', 'salat', 2, 'النَّصُّ الْعَرَبِيُّ فِي الْأَعْلَى وَالتَّرْجَمَةُ تَحْتَهُ.', 'Le texte arabe en haut et la traduction en dessous.')
on conflict (id) do nothing;

-- Questions d'exemple NEUTRES (démontrent le mécanisme du quiz)
insert into public.questions (id, chapter_id, position, prompt_fr, correct_choice_key, explanation_fr) values
  ('quiz-tahara-1', 'tahara', 1, 'Question d''exemple : quelle option est la bonne réponse ?', 'b', 'Correction d''exemple : la bonne réponse était « Option B ».'),
  ('quiz-tahara-2', 'tahara', 2, 'Question d''exemple : combien font 2 + 3 ?', 'b', '2 + 3 = 5.'),
  ('quiz-tahara-3', 'tahara', 3, 'Vrai ou faux (exemple) : Babou est un outil de complément.', 'a', 'Babou est bien un outil pédagogique de complément.'),
  ('quiz-salat-1', 'salat', 1, 'Question d''exemple : que montre le lecteur d''un chapitre ?', 'a', 'Le lecteur affiche le texte arabe et sa traduction.'),
  ('quiz-salat-2', 'salat', 2, 'Question d''exemple : combien font 10 − 4 ?', 'b', '10 − 4 = 6.')
on conflict (id) do nothing;

insert into public.question_choices (id, question_id, position, choice_key, text_fr) values
  ('quiz-tahara-1-a', 'quiz-tahara-1', 1, 'a', 'Option A'),
  ('quiz-tahara-1-b', 'quiz-tahara-1', 2, 'b', 'Option B'),
  ('quiz-tahara-1-c', 'quiz-tahara-1', 3, 'c', 'Option C'),
  ('quiz-tahara-2-a', 'quiz-tahara-2', 1, 'a', '4'),
  ('quiz-tahara-2-b', 'quiz-tahara-2', 2, 'b', '5'),
  ('quiz-tahara-2-c', 'quiz-tahara-2', 3, 'c', '6'),
  ('quiz-tahara-3-a', 'quiz-tahara-3', 1, 'a', 'Vrai'),
  ('quiz-tahara-3-b', 'quiz-tahara-3', 2, 'b', 'Faux'),
  ('quiz-salat-1-a', 'quiz-salat-1', 1, 'a', 'Le texte arabe et sa traduction'),
  ('quiz-salat-1-b', 'quiz-salat-1', 2, 'b', 'Uniquement une image'),
  ('quiz-salat-2-a', 'quiz-salat-2', 1, 'a', '5'),
  ('quiz-salat-2-b', 'quiz-salat-2', 2, 'b', '6'),
  ('quiz-salat-2-c', 'quiz-salat-2', 3, 'c', '7')
on conflict (id) do nothing;
