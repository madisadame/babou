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

## 2026-08-30 — Suppression de compte : passage par une Edge Function, RPC laissée ouverte

**Décision :** le client appelle désormais l'Edge Function authentifiée `delete-account`, qui supprime le Customer RevenueCat **avant** le compte Supabase. La RPC `delete_own_account` reste appelable directement par un utilisateur authentifié — sa révocation est **volontairement différée**.
**Pourquoi :** Google Play exige que la suppression d'un compte efface aussi les données détenues par les sous-traitants ; `delete_own_account` seule laissait le profil RevenueCat orphelin. L'ordre RevenueCat-puis-Supabase est ce qui empêche une suppression partielle silencieuse : un échec laisse tout intact et réessayable, alors que l'ordre inverse aurait détruit le compte sans plus aucun moyen de retenter. La clé secrète RevenueCat ne vit que dans les secrets Supabase, jamais dans le bundle.

**Dette de transition — à lever plus tard.** La version iOS publiée appelle encore la RPC en direct : elle ne supprime donc pas le profil RevenueCat. Révoquer `execute on delete_own_account to authenticated` fermerait ce contournement, mais casserait la suppression de compte pour toute version ancienne encore installée — ce qu'Apple sanctionne. La révocation attendra que le parc soit majoritairement à jour. À décider en relisant les statistiques d'adoption des versions.

**Comportement RevenueCat observé le 2026-08-30** (API v1, comptes jetables), qui fonde l'idempotence : `DELETE` renvoie `200` sur un Customer existant, `404` sur un identifiant sans Customer, et `200` pendant une brève fenêtre juste après suppression avant de se stabiliser sur `404`. Les deux codes attestent l'absence de Customer et sont traités comme un succès ; tout autre code reste fail-closed, `401` compris — une clé révoquée ne doit jamais passer pour une suppression réussie.

## 2026-08-31 — Premier AAB Android : bootstrap assumé, corrections différées

**Décision :** déposer le tout premier AAB (`play-bootstrap`, versionCode 1) en **test interne uniquement**, sans la clé RevenueCat Google, dans le seul but d'enregistrer le package `com.hournews.babou` et de débloquer la section Monétisation de Play Console.
**Pourquoi :** Play n'ouvre la configuration des abonnements qu'après avoir reçu un premier paquet signé. Sans clé `goog_`, `purchasesConfigured` vaut `false` et le paywall Android n'affiche aucune offre : ce build ne doit donc jamais servir de diffusion publique. Le profil est nommé explicitement pour ne pas détourner `production`.

**Vérifié sur l'AAB lui-même** (manifeste protobuf décodé, faute de `bundletool` sur le poste) : `com.android.vending.BILLING` présente — Play reconnaîtra les achats intégrés ; `RECORD_AUDIO` absente ; `versionCode 1`, `compileSdkVersion 36`. Ni `debuggable`, ni `usesCleartextTraffic`, ni activité de client de développement : c'est bien un build release.

### Suite — bootstrap terminé, versionCode 2 préparé (2026-08-31)

Le bootstrap a rempli son office. L'AAB versionCode 1 est publié en **test
interne** sur Google Play, ce qui a enregistré définitivement le package et
ouvert la section Monétisation.

Le profil `play-bootstrap` a été **retiré** d'`eas.json`. Il n'avait qu'une
raison d'être — bâtir sans clé RevenueCat Android — et le déclarer héritier de
l'environnement `production` l'aurait rendu mensonger : il aurait reçu la clé
qu'il prétendait exclure. Les builds passent désormais par `production`.

**RevenueCat Google Play est configuré**, credentials **VALID**. Les deux
produits Google sont importés et actifs :
`com.hournews.babou.premium.monthly:monthly` et
`com.hournews.babou.premium.annual:annual`. Tous deux rattachés à l'entitlement
`premium`. L'offering `default` porte `$rc_monthly` et `$rc_annual`, chacun
couvrant Test Store, App Store et Play Store.

**La clé publique Android `goog_…` ne vit pas dans le dépôt.** `eas.json` étant
versionné et le dépôt public, elle est stockée en variable d'environnement EAS
(`EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`, visibilité `sensitive`) sur les
environnements `production` et `preview`. Les profils correspondants déclarent
désormais `environment` — sans ce champ, aucune variable EAS n'atteint le build.
La clé `test_…` du Test Store reste dans `apps/mobile/.env`, gitignoré et jamais
transmis aux builds EAS : elle ne sert qu'au développement local.

**versionCode 2** prépare le premier build destiné aux achats réels. Trois
points de la dette ci-dessous y sont soldés :

- `cameraPermission: false` — `CAMERA` disparaît. L'app n'appelle jamais
  `launchCameraAsync`. Effet collatéral utile : `NSCameraUsageDescription`,
  qui portait encore le texte anglais par défaut d'`expo-image-picker`,
  disparaît aussi côté iOS.
- `WRITE_EXTERNAL_STORAGE` bloquée via `android.blockedPermissions`. Réaudité :
  l'app n'écrit que dans `Paths.document`, et n'utilise ni `MediaLibrary`, ni
  `expo-sharing`, ni `getContentUriAsync`.
- `READ_EXTERNAL_STORAGE` **conservée** avec son `maxSdkVersion=32` : déjà
  neutralisée sur Android 13+, mais nécessaire à la galerie sur Android 12 et
  antérieur.

Les permissions audio sont intactes — `MODIFY_AUDIO_SETTINGS`,
`FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK` — sans quoi la lecture
en arrière-plan et les contrôles sur écran verrouillé cesseraient.

**Reste ouvert :** `SYSTEM_ALERT_WINDOW`, et la présence du menu de
développement dans le build store (point 3 ci-dessous). `expo-dev-client` n'a
pas été déplacé : le bootstrap a confirmé qu'il s'agissait bien d'un build
release (`developmentClient=false`, ni `debuggable`, ni activité de client de
développement dans le manifeste), donc le problème est ailleurs que dans
`package.json`.

**Prochaine étape :** build Android `production` en versionCode 2, puis achat de
test réel via Google Play depuis la piste de test interne, avec un compte
testeur de licence.

### Dette à solder AVANT le vrai build Android de production

Le prochain AAB — celui qui portera la clé `goog_` et sera diffusé — doit être propre sur ces quatre points :

1. **`cameraPermission: false`** sur `expo-image-picker`. L'app n'appelle jamais `launchCameraAsync` : le seul usage est `launchImageLibraryAsync` dans `src/data/media.ts:15`, côté admin. `CAMERA` s'affiche pourtant sur la fiche Play.
2. **Bloquer `WRITE_EXTERNAL_STORAGE`** via `android.blockedPermissions`, après avoir reconfirmé qu'aucune fonctionnalité n'en dépend. Elle est déclarée sans `maxSdkVersion` donc visible, mais inerte depuis API 30 (Scoped Storage) : l'app n'écrit que dans son répertoire privé (`Paths.document` dans `offline-store.ts`).
3. **Résoudre `SYSTEM_ALERT_WINDOW`.** Elle vient de `react-native/ReactAndroid/src/debug/AndroidManifest.xml`, un manifeste **debug**, et n'a rien à faire dans un build store. Cause identifiée : `expo-dev-client` est en `dependencies`, et l'AAB contient effectivement les ressources du menu de développement (`base/res/drawable-*/dev_menu_fab_icon.png`) et les classes `expo/modules/devmenu` / `devlauncher` dans les dex. À corriger **sans casser les builds `development`** : déplacer le paquet en `devDependencies` n'est pas à soi seul une garantie d'exclusion côté EAS, c'est `developmentClient` qui détermine le type de build.
4. **Recontrôler le prochain AAB** : absence réelle du dev menu et du dev launcher dans le manifeste *et* dans les composants actifs.

**À laisser tel quel :** `READ_EXTERNAL_STORAGE` porte déjà `maxSdkVersion=32`, donc neutralisée sur Android 13+. La retirer casserait la galerie sur Android 12 et antérieur pour un gain nul. `MODIFY_AUDIO_SETTINGS`, `FOREGROUND_SERVICE` et `FOREGROUND_SERVICE_MEDIA_PLAYBACK` sont indispensables à la lecture en arrière-plan (`shouldPlayInBackground` dans `lesson-view.tsx` et `audio-player.tsx`).

**Signature :** keystore d'upload généré par EAS le 2026-08-31, sauvegardé hors dépôt sur le disque externe. Avec Play App Signing, cette clé d'upload est réinitialisable en cas de perte ; la clé de signature d'application, elle, est détenue par Google.
