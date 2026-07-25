# Backend Babou — Supabase

Le backend de Babou est **Supabase** (PostgreSQL + stockage + auth). Ce dossier
contient le schéma et les données initiales. L'app mobile bascule
automatiquement du mock vers Supabase dès que les identifiants sont fournis
(voir `apps/mobile/.env.example`).

## Mise en place (une fois)

1. **Créer un projet** sur [supabase.com](https://supabase.com) (offre gratuite).
2. **Schéma** : dans le projet, ouvrir _SQL Editor_ → coller le contenu de
   [`schema.sql`](./schema.sql) → _Run_.
3. **Données** : coller le contenu de [`seed.sql`](./seed.sql) → _Run_.
4. **Identifiants** : _Settings > API_ → copier _Project URL_ et la clé
   _anon public_.
5. **Configurer l'app** : dans `apps/mobile/`, créer un fichier `.env`
   (à partir de `.env.example`) :

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://ton-projet.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=ta-cle-anon-publique
   ```

6. **Relancer Expo** (`npx expo start --clear`). L'app lit désormais le contenu
   depuis Supabase.

## Administration du contenu

Tant qu'une interface d'admin dédiée n'est pas construite, la gestion du contenu
se fait via **Supabase Studio** (onglet _Table Editor_) : créer / modifier /
supprimer des lignes dans `books`, `chapters` et `chapter_segments`.

- Un **livre** : ligne dans `books`.
- Un **chapitre** : ligne dans `chapters` (avec `book_id` et `position`).
- Une **leçon** : lignes dans `chapter_segments` (`chapter_id`, `position`,
  `arabic`, `translation_fr`, `translation_shimaore`).

Les colonnes `audio_url` et `words` (timings mot-à-mot) sont prêtes pour l'audio
et la vidéo karaoké à venir.

## Modèle

```
books (id, title, description, category, cover_url, position)
  └─ chapters (id, book_id, position, title, description, audio_url)
       ├─ chapter_segments (id, chapter_id, position, arabic,
       │                    translation_fr, translation_shimaore,
       │                    audio_url, words)
       └─ questions (id, chapter_id, position, prompt_fr, prompt_shimaore,
            │        correct_choice_key, explanation_fr, explanation_shimaore)
            └─ question_choices (id, question_id, position, choice_key,
                                 text_fr, text_shimaore)
```

Un **quiz** = les `questions` d'un chapitre, chacune avec ses `question_choices`.
`correct_choice_key` pointe vers le `choice_key` (« a », « b »…) de la bonne
réponse. Les résultats de l'utilisateur (scores, questions maîtrisées) sont
stockés sur l'appareil pour l'instant ; ils seront rattachés à un compte lors
de l'ajout de l'authentification.

Lecture publique via la clé anon (politiques RLS `select`). Les écritures
passent par le rôle service (Supabase Studio), qui contourne la RLS.
