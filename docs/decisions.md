# Journal des décisions

Ce fichier garde une trace des décisions techniques importantes prises pour le projet Babou, et pourquoi.

## 2026-07-22 — Organisation du dépôt

**Décision :** un seul dépôt Git ("monorepo") contenant l'app mobile, l'admin web, les éléments partagés et la documentation.
**Pourquoi :** un seul développeur, mêmes notions de données utilisées des deux côtés (livre, chapitre, question...) → éviter la duplication et les incohérences.

## 2026-07-22 — Outil de gestion du monorepo

**Décision :** npm workspaces.
**Pourquoi :** déjà inclus avec Node.js/npm (aucune installation supplémentaire), suffisant pour le besoin actuel. Alternatives envisagées : pnpm workspaces (plus rapide mais outil à installer), Turborepo (complexité inutile à ce stade).

## 2026-07-22 — Sauvegarde du code

**Décision :** Git en local uniquement pour l'instant, pas encore de dépôt distant (GitHub).
**Pourquoi :** pas encore de compte GitHub prêt. À ajouter plus tard, en dépôt **privé** recommandé vu la nature du contenu (religieux + futur contenu payant).

## 2026-07-22 — Arborescence générale du projet

**Décision :** structure validée avec `apps/mobile` (incluant `assets/`), `apps/admin`, `packages/shared-types`, `backend/` (réservé), `docs/`.
**Pourquoi :** sépare clairement les deux interfaces, prépare le partage de code entre elles, réserve la place du backend sans le choisir prématurément.

## 2026-07-22 — Version de Node.js utilisée pour le projet

**Décision :** Node 22 (LTS) épinglé pour ce projet via `nvm` et un fichier `.nvmrc`, au lieu de la version globale du système (Node 26).
**Pourquoi :** Node 26 (très récente) provoquait une boucle infinie bloquant totalement le démarrage du serveur Expo — incompatibilité entre cette version de Node et les outils Expo (SDK 57 à l'époque). Node 22 est la version LTS que l'écosystème Expo/React Native connaît le mieux. Le Node 26 du système n'a pas été touché, seul ce projet utilise Node 22.

## 2026-07-22 — Version du SDK Expo (downgrade 57 → 54)

**Décision :** revenir de SDK 57 (installé par défaut par `create-expo-app`) à SDK 54.
**Pourquoi :** Expo Go (l'app installée depuis l'App Store/Play Store) ne supporte que la dernière version publiée officiellement de son côté, qui accusait un retard face au SDK 57 tout juste sorti (vérifié via l'API officielle d'Expo : `expoGoSdkVersion: 54.0.0`). Sans ce downgrade, impossible de tester l'app sur un téléphone avec Expo Go.
**Effets de bord corrigés :** dépendances React/React Native dupliquées (réinstallation complète), et deux fichiers utilisant des API propres à SDK 57 (`_layout.tsx`, `use-theme.ts`) adaptés à l'API de SDK 54.
