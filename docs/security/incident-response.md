# Réponse à incident — Babou

Chaque section suit le même ordre : **contenir**, puis **comprendre**, puis
**réparer**. Dans cet ordre — chercher à comprendre avant de contenir laisse la
porte ouverte.

Règle qui prime sur toutes les autres : **créer le remplaçant avant de révoquer
l'ancien**. Une révocation sèche coupe le service pour les utilisateurs
légitimes sans nécessairement arrêter l'attaquant.

---

## Une clé publique a fuité (`anon`, `appl_`, `goog_`)

**Ce n'est pas un incident.** Ces clés sont dans chaque copie de l'application.
Ne rien faire. Si quelqu'un signale « votre clé est exposée sur GitHub », c'est
un rapport de sécurité invalide.

Le seul vrai sujet serait une clé publique dont la RLS *derrière* est
défaillante — c'est la RLS qu'il faudrait corriger, pas la clé.

---

## La clé `service_role` Supabase a fuité — **CRITIQUE**

Elle contourne toute la RLS. Quiconque la détient lit et modifie l'intégralité
de la base.

1. **Contenir** : Supabase → Settings → API → régénérer la clé service.
   L'ancienne meurt immédiatement.
2. **Réparer le service** : les Edge Functions cessent aussitôt de fonctionner.
   Redéployer `revenuecat-webhook` et `delete-account` — elles reçoivent la
   nouvelle clé par injection automatique.
3. **Comprendre** : journaux Supabase, table par table. Chercher les écritures
   dans `admins`, `user_access` et `subscribers` — ce sont les cibles qui
   rapportent quelque chose.
4. **Vérifier** : `list_admins()` ne doit contenir que les administrateurs
   attendus. Toute ligne inconnue dans `user_access.manual_override` est
   suspecte.
5. **Obligation légale** : si des données personnelles ont été consultées,
   notification à la CNIL sous **72 heures** (RGPD, article 33).

---

## La clé secrète RevenueCat a fuité

Accès complet au projet : lecture des clients, suppression, octroi
d'entitlements.

1. RevenueCat → Project settings → API keys → régénérer la clé secrète.
2. `bash supabase/deployer-suppression.sh` avec la nouvelle valeur.
3. Vérifier qu'aucun entitlement `premium` n'a été accordé indûment :
   tableau de bord RevenueCat, filtrer sur les octrois manuels.
4. **Ne pas révoquer les abonnements des utilisateurs** en réaction — un abonné
   légitime perdrait son accès.

---

## Le secret du webhook RevenueCat a fuité

Permet de **forger des événements d'abonnement**, donc de s'accorder l'accès
premium en écrivant dans `subscribers`.

1. Générer une nouvelle chaîne, `supabase secrets set REVENUECAT_WEBHOOK_SECRET`.
2. Mettre à jour l'en-tête `Authorization` dans RevenueCat → Integrations →
   Webhooks. Les deux valeurs doivent correspondre exactement.
3. Auditer `subscribers` : toute ligne dont le `user_id` n'a pas d'achat
   correspondant côté RevenueCat est frauduleuse.

---

## Un compte administrateur est compromis

Le plus grave après la clé service : un admin lit tout le contenu, accorde des
accès et promeut d'autres admins.

1. **Contenir** : retirer immédiatement le compte via `remove_admin(uuid)`,
   depuis un autre compte admin.
2. Forcer la réinitialisation du mot de passe côté Supabase.
3. `list_admins()` — vérifier qu'aucun admin n'a été ajouté par l'attaquant.
4. Revoir `user_access` : les accès offerts récents et non justifiés.
5. Vérifier le contenu : un admin peut modifier livres et chapitres.

---

## GitHub est compromis

Le dépôt est public : le code n'est pas un secret. Le risque réel est
l'**injection de code malveillant** dans une version future.

1. Révoquer les jetons personnels et les clés SSH du compte.
2. Réinitialiser le mot de passe, vérifier la 2FA.
3. `git log --all` — chercher tout commit non reconnu.
4. Comparer le dernier build publié à l'état attendu du dépôt.
5. La protection de branche empêche déjà la réécriture de `main` par
   force-push : l'historique est fiable.

---

## Apple ou Google Play est compromis

Le pire scénario du lot : publication d'une version malveillante sous ton nom.

1. Changer le mot de passe, vérifier la 2FA, révoquer les sessions.
2. Vérifier la liste des utilisateurs ayant accès à la console.
3. Vérifier qu'aucune version non reconnue n'est en cours de diffusion.
   **Suspendre la diffusion** au moindre doute.
4. Android : la clé d'upload étant réinitialisable via Play App Signing, une
   compromission de cette clé seule ne permet pas de publier — il faut aussi
   l'accès au compte.
5. Contacter le support de la boutique concernée.

---

## Une dépendance npm est malveillante

1. **Ne pas mettre à jour** en réflexe : la version saine est peut-être celle
   déjà installée.
2. Identifier la version compromise (avis GitHub, GHSA).
3. `npm ls <paquet>` — déterminer si elle atteint le bundle ou seulement le
   build. Une compromission d'outil de build est moins grave mais permet
   d'injecter dans l'application au build suivant.
4. Épingler une version saine via `overrides` dans le `package.json` racine.
5. `npm run check`, puis build de test avant toute publication.
6. Si un build a déjà été publié avec la version compromise : retirer la
   version des boutiques et republier.

---

## Des données utilisateurs sont exposées

1. Mesurer : quelles tables, combien de personnes, quelles catégories de
   données. `user_state`, `reading_progress` et `quiz_results` ne contiennent
   ni donnée bancaire ni donnée sensible au sens du RGPD ; `auth.users`
   contient les adresses e-mail.
2. Colmater la faille **avant** de communiquer.
3. **Notification CNIL sous 72 heures** si le risque pour les personnes n'est
   pas négligeable.
4. Informer les personnes concernées si le risque est élevé.
5. Consigner l'incident, sa chronologie et les mesures prises — le registre est
   obligatoire, même sans notification.

---

## Contacts et ressources

- Support Supabase : tableau de bord du projet
- Support RevenueCat : app.revenuecat.com
- CNIL, notification de violation : notifications.cnil.fr
- Page d'état Supabase : status.supabase.com
