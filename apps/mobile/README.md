# Application Babou

L'application, construite avec React Native et Expo (SDK 54, expo-router).
Elle contient aussi l'espace d'administration (`src/app/admin/`), réservé aux
comptes administrateurs.

## Lancer

```bash
nvm use        # Node 22
npm start      # puis i / a / w pour iOS, Android, web
npm run check  # types + export des trois plateformes
```

`npm run check` est à passer avant de considérer une tâche comme terminée :
iOS, Android **et** web doivent fonctionner.

Un fichier `.env` (voir `.env.example`) fournit les identifiants Supabase. Sans
lui, l'app tourne sur un jeu de données fictives en développement.

Les achats intégrés reposent sur un module natif : ils ne fonctionnent pas dans
Expo Go, il faut un build de développement EAS.

## Organisation de `src/`

- `app/` — les écrans, routés par le nom des fichiers (expo-router).
- `domain/` — les types métier purs (livre, chapitre, leçon, question…).
- `data/` — l'accès aux données : interface de repository, implémentation
  Supabase, cache hors-ligne, achats intégrés.
- `hooks/` — l'état applicatif (accès, authentification, progression,
  révisions, préférences…).
- `components/`, `i18n/`, `constants/`, `lib/` — interface, traductions, thème,
  utilitaires.

## À lire avant de coder

`AGENTS.md` — la règle des trois plateformes et les pièges déjà rencontrés,
notamment ceux propres au web (`Alert.alert` muet, `window` en rendu Node,
fond transparent). Ils ont tous coûté une session de débogage.
