# Feuille de route

État au 2026-08-20.

## Étapes de construction

1. [x] Valider l'arborescence générale du projet
2. [x] Créer la structure technique de base
3. [x] Créer l'application mobile avec React Native et Expo
4. [x] Construire les écrans de démonstration avec des données fictives —
   **dépassé** : depuis le 2026-07-25 l'app lit le contenu réel dans Supabase.
   Le jeu de données fictives ne sert plus qu'en développement, quand aucune
   configuration Supabase n'est présente.
5. [x] Créer l'interface d'administration — **réalisée autrement** : elle vit
   dans l'app elle-même (`apps/mobile/src/app/admin/`, réservée aux comptes
   administrateurs) plutôt que dans un site web séparé. Le dossier `apps/admin/`
   est resté vide. Voir `decisions.md`.
6. [x] Choisir et connecter le backend — Supabase (Postgres + Auth + Storage).
7. [~] Fonctionnalités, paiements, tests et publication — fonctionnalités et
   paiements faits ; **la publication est en cours**.

## Ce qui est en place

- **Lecture** : livres → chapitres → leçon en segments (texte arabe, traduction
  française et shimaoré, explication), taille de texte réglable, mode récitation,
  marque-pages, reprise de lecture, recherche et filtres dans la bibliothèque.
- **Audio** : récitation et traduction par segment ou pour le chapitre entier,
  vitesse de 0,75× à 2×, lecture en arrière-plan et contrôles sur l'écran
  verrouillé, karaoké mot-à-mot quand les timings sont saisis.
- **Quiz** : quiz de fin de chapitre, révision espacée des questions ratées,
  quiz final par livre.
- **Régularité** : temps d'étude du jour, objectif quotidien, série de jours.
  Aucun classement, par choix.
- **Compte** : inscription par e-mail, synchronisation de la progression, des
  quiz, des marque-pages et des préférences ; suppression de compte.
- **Hors connexion** : téléchargement d'un livre, audio compris.
- **Administration in-app** : livres, chapitres, segments, questions, timings,
  upload de médias, brouillon/publication, multi-administrateurs, statistiques
  de contenu, audience, interrupteur d'abonnement et accès offerts.
- **Abonnement** : achats intégrés via RevenueCat, essai d'une semaine, livre
  vitrine ouvert à tous, verrouillage appliqué côté base par la RLS.

## Publication (en cours)

Le build **iOS 1.0.0 (5)** est dans App Store Connect. La soumission du
**2026-08-17 a été refusée** — règle 3.1.2 : la description de la fiche devait
mentionner le titre, la durée et le prix de chaque abonnement, avec un lien
fonctionnel vers les conditions d'utilisation. Refus de métadonnées seulement,
**aucun rebuild nécessaire**. La description corrigée est prête dans
`fiche-app-store.md` (commit du 2026-08-19).

Restant :

- [ ] Coller la description corrigée dans App Store Connect et resoumettre.
- [ ] Renseigner un compte de démonstration dans les notes de revue (les
      emplacements sont encore des marques à remplir dans `fiche-app-store.md`).
- [ ] Confirmer que le paywall affiche les vrais prix sur l'appareil — les
      produits d'App Store Connect n'étaient pas servis lors du dernier essai
      (RevenueCat, erreur 23) : vérifier le contrat Applications payantes et la
      clé `.p8` côté RevenueCat.
- [ ] Tester la réinitialisation du mot de passe avec un vrai lien reçu par
      e-mail (branche jamais éprouvée).
- [ ] Relancer `node backend/verifier-schema.mjs` avant chaque soumission.

Android est fonctionnel mais n'est pas soumis à ce stade : pas de clé RevenueCat
Android, pas de fiche Play Store.

## Après le lancement

- **Rendre le bucket `media` privé.** Les fichiers audio et les couvertures des
  livres payants restent atteignables par URL directe ; la RLS ne protège que
  les métadonnées. Report assumé le 2026-08-08 (voir `decisions.md`).
- **SMTP personnalisé** pour Supabase : l'envoi intégré est bridé à quelques
  messages par heure, ce qui rend le « mot de passe oublié » muet en cas
  d'affluence.
- **Sauvegardes** : l'offre gratuite n'en fait aucune. `backend/export.mjs`
  existe, mais son exécution reste manuelle.
- **Transition « page tournée » sur toutes les navigations** : suppose de passer
  au navigateur JavaScript de React Navigation ; refonte du cœur de la
  navigation, à faire hors période de soumission.
- **Traductions shimaoré de l'interface** : `src/i18n/shimaore.ts` est vide,
  l'interface retombe sur le français.
- **EAS Update** : sans lui, chaque correctif impose un build et une revue.
- **Enregistrement audio dans l'admin** : reporté volontairement pour ne pas
  demander la permission micro à la première soumission.
- **Vidéo de cours** : prévue à l'origine, jamais implémentée. Le contenu est
  aujourd'hui textuel et audio.
