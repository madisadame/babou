# Backend Babou — Supabase

Le backend de Babou est **Supabase** (PostgreSQL + Auth + Storage). Ce dossier
contient le schéma, les migrations datées et les scripts de maintenance.

L'app bascule automatiquement du contenu fictif vers Supabase dès que
`apps/mobile/.env` contient les identifiants (voir `.env.example`).

## Mise en place (une fois)

1. **Créer un projet** sur [supabase.com](https://supabase.com).
2. **Exécuter les fichiers SQL dans l'ordre**, dans _SQL Editor_ :
   `schema.sql`, `sync.sql`, `storage.sql`, `admin.sql`, puis **toutes les
   migrations datées par ordre chronologique**, et enfin `seed.sql` si tu veux
   du contenu de démonstration.
3. **Identifiants** : _Settings > API_ → _Project URL_ et clé publique.
4. **Configurer l'app** : créer `apps/mobile/.env` à partir de `.env.example` :

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://ton-projet.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=ta-cle-publique
   ```

5. **Relancer Expo** (`npx expo start --clear`).

Pour copier un fichier SQL vers l'éditeur Supabase, passer par le
presse-papiers (`cat backend/schema.sql | pbcopy`) plutôt que par un
copier-coller depuis une conversation : les apostrophes s'y corrompent.

> ⚠️ **`schema.sql` contient des politiques de lecture périmées** qui ouvrent
> tout le contenu (`using (true)`). Si tu le rejoues sur une base existante,
> **rejoue ensuite `2026-08-06-content-access.sql`**, sinon le contenu payant
> redevient extractible par l'API REST avec la seule clé publique. Un
> avertissement est en tête du fichier.

## Vérifier et sauvegarder

Un fichier de migration présent dans le dépôt ne prouve rien sur l'état réel de
la base — trois migrations n'avaient jamais été exécutées, dont celle de la
suppression de compte exigée par Apple.

```bash
node backend/verifier-schema.mjs   # compare les fichiers SQL à la vraie base
node backend/export.mjs            # sauvegarde du contenu et des données
```

Lancer le premier **après chaque migration et avant chaque soumission**.
L'offre gratuite ne fait aucune sauvegarde automatique : l'export est le seul
filet, et il est manuel. Ses fichiers atterrissent dans `backups/`, exclu du
dépôt car ils contiennent les adresses e-mail des inscrits.

## Administration du contenu

Elle se fait **dans l'application**, avec un compte administrateur
(`src/app/admin/`) : livres, chapitres, segments, questions, timings karaoké,
upload de médias, brouillon/publication, statistiques et accès offerts.
Supabase Studio ne sert plus qu'au dépannage et aux opérations ponctuelles.

## Modèle

```
books (id, title, description, category, cover_url, position, published, showcase)
  └─ chapters (id, book_id, position, title, description, audio_url, published)
       ├─ chapter_segments (id, chapter_id, position, arabic,
       │                    translation_fr, translation_shimaore,
       │                    audio_url, translation_audio_fr/_shimaore,
       │                    explanation_fr/_shimaore,
       │                    explanation_audio_fr/_shimaore,
       │                    words)
       └─ questions (id, chapter_id, position, prompt_fr, prompt_shimaore,
            │        correct_choice_key, explanation_fr, explanation_shimaore)
            └─ question_choices (id, question_id, position, choice_key,
                                 text_fr, text_shimaore)
```

Un **quiz** = les `questions` d'un chapitre, chacune avec ses `question_choices`.
`correct_choice_key` pointe vers le `choice_key` (« a », « b »…) de la bonne
réponse. `words` porte les timings mot-à-mot de la récitation (karaoké).

Données utilisateur : `reading_progress` (progression), `quiz_results`,
`user_state` (marque-pages, série, révisions, préférences), `site_content`
(textes de l'accueil éditables en admin).

## Accès et sécurité

- **Lecture du contenu** : conditionnée par `has_content_access()`, qui rejoue
  côté base la logique du client — abonnement globalement désactivé, compte
  administrateur, accès offert, abonné, ou essai de 7 jours. Le livre **vitrine**
  (`books.showcase`) échappe à cette règle et reste lisible sans compte.
  ⚠️ La durée d'essai existe des deux côtés : garder `TRIAL_DAYS` de
  `use-access.tsx` en phase avec la fonction SQL.
- **Écriture** : réservée aux administrateurs (table `admins` + `is_admin()`).
- **Abonnements** : `subscribers` est un miroir local de RevenueCat, écrit
  uniquement par le webhook (`supabase/functions/revenuecat-webhook/`), car la
  base ne peut pas interroger RevenueCat pendant une requête.
- **Brouillons** : un livre ou un chapitre non publié n'est visible que des
  administrateurs, par politique RLS.
- **Limite connue** : le bucket `media` est en lecture publique — les fichiers
  audio et les couvertures restent atteignables par URL directe. Correction
  prévue après le lancement (voir `docs/roadmap.md`).
