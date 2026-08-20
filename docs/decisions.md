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

## 2026-07-25 — Hiérarchie du contenu et couche repository

**Décision :** Bibliothèque → **Livre** → **Chapitre** → leçon (segments) + quiz. Les écrans ne lisent jamais une source de données directement : ils passent par une interface de *repository* (`src/data/content-repository.ts`), dont il existe une implémentation fictive et une implémentation Supabase.
**Pourquoi :** le premier jet appelait « livres » ce qui étaient en réalité des chapitres (Tahara, Salat, Sawm…). Corriger tôt évitait de propager l'erreur dans la progression et les quiz. Le repository permet de changer de source sans toucher aux écrans — c'est ce qui a rendu le branchement de Supabase indolore, puis l'ajout d'une couche de cache hors-ligne par-dessus.

## 2026-07-25 — Backend : Supabase

**Décision :** Supabase (Postgres pour le contenu, Auth pour les comptes, Storage pour l'audio et les couvertures). Bascule automatique du contenu fictif vers Supabase dès que `apps/mobile/.env` contient l'URL et la clé publique.
**Pourquoi :** le contenu est relationnel (livres, chapitres, segments, questions, choix) ; une base relationnelle avec des règles de sécurité par ligne (RLS) évitait d'écrire un serveur. La bascule automatique a permis de continuer à travailler sans configuration, sans branche ni interrupteur manuel.

## 2026-07-25 — Deux axes d'internationalisation

**Décision :** séparer la langue de **l'interface** (fichiers `src/i18n/`, solution maison typée plutôt qu'une bibliothèque) de la langue du **contenu** (colonnes de traduction en base). Un seul choix utilisateur pilote les deux. Le shimaoré retombe automatiquement sur le français pour toute clé absente.
**Pourquoi :** l'arabe est toujours présent dans le contenu ; ce qui change, c'est la traduction affichée. Le repli évite qu'une traduction manquante casse un écran, et laisse remplir `shimaore.ts` progressivement sans rien réécrire.

## 2026-07-25 — Administration dans l'app, pas dans un site séparé

**Décision :** l'espace d'administration vit dans l'application (`src/app/admin/`), protégé par une table `admins` et des règles RLS d'écriture, au lieu du site web prévu dans `apps/admin/`.
**Pourquoi :** un seul code à écrire et à maintenir, les mêmes types métier, la même couche d'accès aux données, et le contenu se saisit depuis un téléphone. L'app tournant aussi sur le web, l'administration reste accessible au clavier depuis un navigateur. `apps/admin/` est resté vide.

## 2026-07-29 — L'application sera payante (abonnement)

**Décision :** abonnement auto-renouvelable — 9,99 €/mois ou 79,99 €/an, première semaine offerte — via les achats intégrés. Les dons/sadaqa envisagés auparavant ne débloquent rien. Un interrupteur en base (`app_config.subscription_enabled`) garde toute l'app libre tant qu'il n'est pas activé.
**Pourquoi :** révision de la décision « app entièrement gratuite ». L'objectif est de permettre à qui gère l'application d'en faire une activité pérenne. L'interrupteur permet de publier, d'observer, puis d'activer le paiement sans nouvelle version ; l'essai démarre à la date d'activation pour les comptes déjà inscrits.

## 2026-07-29 — RevenueCat pour les achats intégrés

**Décision :** passer par RevenueCat (`react-native-purchases`) plutôt que d'appeler StoreKit et la facturation Play directement.
**Pourquoi :** un abonnement qui débloque du contenu doit obligatoirement passer par l'achat intégré — un lien de paiement externe vaut un rejet certain. RevenueCat unifie les deux magasins, gère les restaurations et expose un webhook qui tient la base à jour. Contrainte acceptée : module natif, donc pas testable dans Expo Go — il faut un build de développement.

## 2026-07-30 — iPhone uniquement au lancement

**Décision :** `supportsTablet: false`.
**Pourquoi :** l'iPad impose son propre jeu de captures d'écran et sa propre vérification de mise en page, pour un public secondaire. À rouvrir plus tard si la demande existe.

## 2026-07-30 — Dépôt GitHub public (révise la décision du 22 juillet)

**Décision :** le dépôt `github.com/madisadame/babou` est **public**, et sert la politique de confidentialité ainsi que la page d'assistance via GitHub Pages (dossier `/docs`).
**Pourquoi :** Apple exige une URL de politique de confidentialité accessible publiquement ; GitHub Pages évite d'acheter un hébergement. Audit fait avant l'ouverture : aucun secret dans l'historique, seule la clé *publishable* Supabase est exposée, ce qui est son rôle. En contrepartie, `.gitignore` exclut `backups/` — les exports de la base contiennent les adresses e-mail des inscrits.

## 2026-08-01 — Trois plateformes obligatoires : iOS, Android et Web

**Décision :** aucune fonctionnalité n'est terminée tant que les trois ne fonctionnent pas. Vérification par `npm run check` (types + export iOS/Android/Web) avant de clore une tâche.
**Pourquoi :** l'export web fait un rendu côté Node et attrape des erreurs invisibles sur mobile (`window is not defined`, dialogues natifs muets, fond transparent qui rend le texte crème illisible). Ces pièges sont consignés dans `apps/mobile/AGENTS.md`. Le web sert aussi de porte d'entrée à l'administration au clavier.

## 2026-08-06 — Verrouiller le contenu payant côté base, pas seulement à l'écran

**Décision :** la restriction d'accès est appliquée par des règles RLS s'appuyant sur une fonction `has_content_access()`, doublée d'un livre « vitrine » (colonne `books.showcase`) lisible sans compte. Une table `subscribers` recopie localement l'état des abonnements, alimentée par le webhook RevenueCat.
**Pourquoi :** le blocage ne vivait que dans l'app ; tout le contenu publié restait lisible avec la seule clé publique, donc l'abonnement se contournait avec une simple requête HTTP. Inacceptable pour une app payante. La base ne pouvant pas interroger RevenueCat pendant une requête, il fallait un miroir local.

## 2026-08-08 — Identifiant d'application : `com.hournews.babou`

**Décision :** remplacer `com.madisadame.babou` avant la première publication.
**Pourquoi :** l'application sera exploitée par la société hournews. Cet identifiant est définitif dès la première mise en ligne — le changer après aurait imposé de repartir d'une nouvelle fiche.

## 2026-08-08 — Retrait de l'écran « Soutenir » avant soumission

**Décision :** supprimer entièrement l'écran de dons, sa carte d'accueil, son entrée dans les réglages et le lien « don libre » du paywall.
**Pourquoi :** deux motifs de rejet cumulés — une mention « bientôt disponible » (fonctionnalité incomplète) et un chemin de paiement externe affiché sur l'écran d'abonnement. Les dons pourront revenir plus tard, séparés du paywall.

## 2026-08-08 — Bucket média public : correction reportée

**Décision :** laisser le bucket `media` en lecture publique pour la première soumission, et le passer en privé ensuite, avec une couche de signature des URL centralisée dans le repository.
**Pourquoi :** ce n'est pas un motif de rejet, et l'exposition suppose d'avoir déjà obtenu les URL, qui ne se découvrent qu'en lisant des lignes protégées par la RLS. La correction invalide d'un coup sept colonnes d'URL stockées en base et impose de retester tous les médias — un chantier à ne pas mener la veille d'une soumission.

## 2026-08-09 — Épingler `expo-asset` et vérifier avec expo-doctor

**Décision :** `expo-asset` déclaré en dépendance directe et forcé par un `overrides` à la racine ; `npx expo-doctor` devient un passage obligé avant tout build de production.
**Pourquoi :** le premier build de production restait figé sur l'écran de démarrage. Cause : `expo-audio` acceptant n'importe quelle version d'`expo-asset`, npm installait celle d'un autre SDK à la racine ; un build natif n'en lie qu'une, et c'est elle qui résout l'image de démarrage — l'échec survenait avant que React ne démarre. Invisible en développement, où les ressources viennent du serveur. C'est expo-doctor qui a révélé le doublon.

## 2026-08-12 — Sauvegardes de la base par script

**Décision :** écrire `backend/export.mjs` plutôt que souscrire une offre Supabase payante pour l'instant.
**Pourquoi :** l'offre gratuite ne fait aucune sauvegarde et le contenu représente un travail considérable qu'une fausse manœuvre effacerait sans retour. Le script couvre le besoin immédiat ; son exécution reste manuelle, ce qui est la limite connue de ce choix.

## 2026-08-12 — Généralisation de la transition « page tournée » reportée

**Décision :** garder le glissement latéral partout et la liasse de pages au retour à l'accueil ; remettre la généralisation à après la soumission, en remplaçant alors le navigateur natif par le navigateur JavaScript de React Navigation.
**Pourquoi :** l'étendre touche 65 appels de navigation dans 26 fichiers, et un habillage maison ferait perdre le retour au balayage depuis le bord de l'écran. C'est une refonte du cœur de la navigation, pas un réglage.

## 2026-08-19 — Compte Apple : personne physique, conversion plus tard

**Décision :** publier avec le compte développeur inscrit en personne physique, puis le **convertir** en organisation une fois l'app en ligne.
**Pourquoi :** attendre la création du dossier société retardait la sortie. Une conversion du même compte conserve l'équipe, les applications et les abonnés — à ne pas confondre avec un transfert d'app entre deux comptes, très délicat quand des abonnements sont actifs. À savoir : le vendeur affiché est le nom civil, et le statut de professionnel dans l'Union européenne rend publiques des coordonnées — renseigner celles du siège de hournews, pas les coordonnées privées.
