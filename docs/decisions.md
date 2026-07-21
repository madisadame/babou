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
