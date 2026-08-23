# Babou

Application d'apprentissage du fiqh selon l'école shâfi'ite : livres découpés en
chapitres courts, texte arabe accompagné de sa traduction française et shimaoré,
audio, et quiz de fin de chapitre.

L'application est fonctionnellement complète et **en cours de publication sur
l'App Store**.

## À lire avant de toucher au code de l'app

`apps/mobile/AGENTS.md` — pièges connus, notamment ceux propres au web. Ce
fichier fait autorité sur tout ce qui concerne `apps/mobile/`.

## Node 22 obligatoire

Fixé par `.nvmrc`. Les versions plus récentes cassent le démarrage d'Expo.

```bash
nvm use
npm install        # depuis la racine : npm workspaces
```

## Terminer une tâche

Aucune tâche n'est finie tant que les **trois** plateformes (iOS, Android, web)
ne fonctionnent pas :

```bash
cd apps/mobile && npm run check   # tsc + expo export ios/android/web
```

L'export web fait un rendu Node statique (expo-router) : c'est lui qui attrape
les crashs propres au web, du type `window is not defined`.

## Structure

- `apps/mobile/` — **l'application** (React Native + Expo, iOS/Android/web).
  Contient aussi l'espace d'administration (`src/app/admin/`), réservé aux
  comptes administrateurs.
- `backend/` — **Supabase** : `schema.sql`, migrations datées
  (`AAAA-MM-JJ-sujet.sql`) et scripts de maintenance. Voir `backend/README.md`.
- `supabase/functions/` — fonctions déployées, dont le webhook RevenueCat qui
  tient l'état des abonnements à jour.
- `docs/` — documentation, et pages publiques servies par GitHub Pages
  (`confidentialite.html`, `assistance.html`).
- `apps/admin/` et `packages/shared-types/` — dossiers réservés au démarrage du
  projet, **jamais remplis**, laissés volontairement vides. Ne pas s'attendre à
  y trouver du code ; voir `docs/decisions.md`.

## Documentation

- `docs/roadmap.md` — ce qui est fait, ce qui reste
- `docs/decisions.md` — les choix techniques et leurs raisons
- `docs/glossaire.md` — le vocabulaire du projet

## Configuration

L'app a besoin d'un `apps/mobile/.env` avec l'URL et la clé publique Supabase —
voir `apps/mobile/.env.example` et `backend/README.md`. Ce fichier n'est pas
versionné.

## Langue

Le projet est rédigé en français : commits, documentation, commentaires et
noms de fichiers de migration. S'y tenir.
