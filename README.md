# Babou

Application d'apprentissage du fiqh selon l'école shâfi'ite : des livres
découpés en chapitres courts, le texte arabe accompagné de sa traduction en
français et en shimaoré, l'audio, et un quiz à la fin de chaque chapitre.

## Structure du projet

- `apps/mobile/` — **l'application** (React Native + Expo). Elle tourne sur iOS,
  Android et le web, et contient aussi l'espace d'administration
  (`src/app/admin/`), réservé aux comptes administrateurs.
- `backend/` — **Supabase** : schéma, migrations datées et scripts de
  maintenance. Voir `backend/README.md`.
- `supabase/functions/` — fonctions déployées, dont le webhook RevenueCat qui
  tient l'état des abonnements à jour.
- `docs/` — documentation du projet, et pages publiques servies par GitHub Pages
  (politique de confidentialité, assistance).
- `apps/admin/` et `packages/shared-types/` — dossiers réservés au démarrage du
  projet, jamais remplis. Voir leurs README respectifs.

## Démarrer

Node 22 est requis (fixé par `.nvmrc` ; les versions plus récentes cassent le
démarrage d'Expo).

```bash
nvm use            # Node 22
npm install        # depuis la racine : npm workspaces
cd apps/mobile
npm start          # Expo (puis i / a / w pour iOS, Android, web)
```

L'application a besoin d'un fichier `apps/mobile/.env` contenant l'URL et la clé
publique Supabase — voir `apps/mobile/.env.example` et `backend/README.md`.

Avant de considérer une tâche comme terminée :

```bash
cd apps/mobile && npm run check   # types + export iOS, Android et web
```

Les trois plateformes doivent fonctionner. Les pièges connus, notamment ceux
propres au web, sont consignés dans `apps/mobile/AGENTS.md` — à lire avant de
toucher au code.

## État d'avancement

L'application est fonctionnellement complète et **en cours de publication sur
l'App Store**. Le détail de ce qui reste à faire est dans `docs/roadmap.md` ;
les choix techniques et leurs raisons dans `docs/decisions.md` ; le vocabulaire
du projet dans `docs/glossaire.md`.
