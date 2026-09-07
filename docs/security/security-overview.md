# Sécurité de Babou — vue d'ensemble

Audit du 2026-09-02. Chaque affirmation ci-dessous a été **vérifiée en réel**
contre le projet de production, pas déduite de la configuration.

## Le modèle de menace, en une phrase

Babou est une application mobile sans serveur propre : tout ce qui compte est
chez Supabase, RevenueCat et les deux boutiques. Il n'y a donc **pas de
pare-feu réseau à configurer** — la surface d'attaque est faite d'API publiques,
et la seule défense qui vaille est l'autorisation côté base.

Corollaire : le client mobile est du code **hostile par nature**. Tout ce qu'il
embarque est lisible (clés publiques comprises), et toute règle appliquée
uniquement dans l'interface est contournable. C'est pourquoi l'essentiel des
contrôles vit dans PostgreSQL.

## Ce qui protège réellement

### Row Level Security — la vraie défense

Le contenu payant est filtré **par la base**, pas par l'écran. Les politiques de
`books`, `chapters`, `chapter_segments`, `questions` et `question_choices`
exigent toutes `published and (showcase or has_content_access())`.

Vérifié en anonyme : un visiteur non connecté voit **1 livre, 1 chapitre,
1 segment** — la vitrine — et rien d'autre. Interroger l'API directement ne
donne pas plus que l'application.

`has_content_access()` accorde l'accès à un administrateur, à un accès offert
manuellement, à un abonné actif, ou pendant les 7 jours d'essai. Le paywall
n'est donc pas une illusion d'interface.

### Tables utilisateur : cloisonnées

`user_state`, `reading_progress`, `quiz_results`, `user_access`, `subscribers`
et `admins` renvoient toutes une liste **vide** en anonyme. Chaque utilisateur
ne lit que ses propres lignes (`auth.uid() = user_id`).

`subscribers` n'a **aucune politique d'écriture** : seul le webhook, via la clé
service, y écrit. Un client ne peut pas se déclarer abonné.

### Fonctions privilégiées

19 fonctions `SECURITY DEFINER`, **toutes** avec `set search_path = public` —
aucune n'est vulnérable à une attaque par manipulation du chemin de recherche.

Huit fonctions d'administration sont exposées au rôle `authenticated`, ce qui
est normal en Supabase où il n'existe pas de rôle applicatif intermédiaire.
Chacune contrôle `is_admin()` en interne. **Testé en conditions réelles** avec
un compte jetable non-administrateur :

| Tentative | Résultat |
|---|---|
| `set_user_access` — s'auto-offrir l'accès | `not authorized` |
| `add_admin_by_email` — se promouvoir admin | `forbidden`, compte non promu |
| `set_subscription_enabled` | `not authorized` |
| `admin_find_user`, `admin_user_stats` | `not authorized` |
| `list_admins`, `content_stats` | zéro ligne (filtre `where is_admin()`) |

L'escalade de privilèges est fermée.

### Introspection verrouillée

`GET /rest/v1/` renvoie **401 — Secret API key required**. Le schéma complet
n'est pas énumérable avec la clé publique.

### Storage

Écriture réservée aux administrateurs — testé : l'upload échoue en anonyme
**et** en authentifié non-admin (`new row violates row-level security policy`).

Lecture publique, en revanche. Voir la réserve plus bas.

### Suppression de compte

Passe par l'Edge Function `delete-account` (JWT vérifié par la passerelle), qui
supprime le profil RevenueCat **avant** le compte Supabase. Un échec laisse tout
intact et réessayable — pas de suppression partielle silencieuse. L'utilisateur
est déduit du seul JWT, jamais d'un identifiant transmis.

### Secrets

Aucun secret dans le dépôt, vérifié sur les fichiers suivis **et sur tout
l'historique Git**. La clé secrète RevenueCat et la clé service Supabase
n'existent que dans les secrets Supabase, côté serveur. La clé publique Android
`goog_` vit en variable d'environnement EAS, pas dans `eas.json`.

## Ce qui reste faible

### Bucket `media` public — portée réelle limitée

N'importe qui peut lister et télécharger sans authentification. Mais
l'inventaire réel au 2026-09-02 est de **7 fichiers, 281 Ko** : deux couvertures
JPEG et **cinq fichiers de 0 octet au nom corrompu** (`…-8nle7d.blob:http:`),
résidus d'uploads ratés depuis l'admin web.

**Aucun fichier audio n'est stocké** — les colonnes audio des segments sont
toutes nulles. Le risque « contenu payant exposé par URL directe » n'est donc
pas matérialisé aujourd'hui. Il le deviendra dès le premier audio téléversé.

### Mot de passe : 6 caractères minimum

Le défaut Supabase. Trop faible pour un compte donnant accès à un abonnement
payant. Réglage de tableau de bord, non modifiable en ligne de commande.

### Pas de surveillance des erreurs

Aucun Sentry ni équivalent. Un crash massif après mise à jour ne serait connu
que par les avis sur les boutiques.

## Ce qui n'est pas un risque, contrairement aux apparences

**Les clés publiques dans le dépôt.** `EXPO_PUBLIC_SUPABASE_ANON_KEY` et
`EXPO_PUBLIC_REVENUECAT_IOS_KEY` sont dans `eas.json`, versionné et public.
C'est **normal** : ces clés sont conçues pour être distribuées dans le binaire.
La clé anon ne donne aucun droit que la RLS n'accorde ; extraite d'un APK, elle
ne sert à rien de plus. Les révoquer n'apporterait rien.

**L'énumération d'e-mails.** Testé : une adresse existante et une adresse
inconnue renvoient le même `Invalid login credentials`.

## Références

- `incident-response.md` — que faire quand ça tourne mal
- `backup-restore.md` — sauvegardes et restauration
- `secrets-inventory.md` — où vit quoi, sans aucune valeur
- `monitoring-alerts.md` — ce qu'on détecte et ce qu'on ne détecte pas
- `update-policy.md` — mettre à jour sans casser
