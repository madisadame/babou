# Inventaire des secrets — Babou

**Ce fichier ne contient aucune valeur.** Il dit où vit quoi, qui y a accès, et
comment faire tourner chaque secret. Il est versionné dans un dépôt public :
n'y écrivez jamais de valeur, même tronquée.

## Classification

| Secret | Emplacement | Nature | Gravité si fuite |
|---|---|---|---|
| Supabase `service_role` | Secrets Supabase (injecté dans les Edge Functions) | **serveur** | **CRITIQUE** — contourne toute la RLS |
| RevenueCat `sk_` (secrète) | Secrets Supabase, `REVENUECAT_SECRET_API_KEY` | **serveur** | **CRITIQUE** — accès complet au projet RevenueCat |
| `REVENUECAT_WEBHOOK_SECRET` | Secrets Supabase | **serveur** | ÉLEVÉE — permet de forger des événements d'abonnement |
| Compte de service Google Play (JSON) | Verbatim, `Sauvegardes/Babou/Google-Play-service-account/` | **serveur** | ÉLEVÉE |
| Keystore d'upload Android | Verbatim, `Sauvegardes/Babou/Android-signing/` | **signature** | MOYENNE — réinitialisable via Play App Signing |
| Clé Apple `.p8` | Compte Apple / sauvegarde hors dépôt | **signature** | MOYENNE |
| Mot de passe MySQL / admin Supabase | Coffre personnel | serveur | ÉLEVÉE |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `eas.json`, versionné | **publique** | **NULLE** — conçue pour être distribuée |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` (`appl_`) | `eas.json`, versionné | **publique** | NULLE |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` (`goog_`) | Variables EAS, visibilité `sensitive` | **publique** | NULLE |

La distinction publique/serveur est celle qui compte. Une clé publique est
extractible de n'importe quel APK en quelques minutes : la protéger n'a pas de
sens, seule la RLS derrière elle protège quoi que ce soit.

## Pourquoi la clé Android n'est pas dans `eas.json`

Techniquement elle pourrait y être, comme la clé iOS — elle est tout aussi
publique. Elle a été placée en variable d'environnement EAS sur décision
explicite, pour qu'aucune clé RevenueCat de production ne transite par un dépôt
public. C'est une mesure d'hygiène, pas une nécessité cryptographique.

## Protections en place contre un commit accidentel

`.gitignore` couvre : `*.keystore`, `*.jks`, `credentials.json`,
`*-service-account*.json`, `revenuecat-*.json`, `.env`, `.env.*`,
`docs/compte-demo.local.md`, `backups/`.

Depuis le 2026-09-02, GitHub applique en plus :
- **secret scanning** — détecte un secret déjà poussé ;
- **push protection** — refuse le push qui contiendrait un secret reconnu.

Vérifié : aucun secret dans les fichiers suivis ni dans **tout l'historique**.

## Rotation

| Secret | Procédure | Impact |
|---|---|---|
| RevenueCat secrète | Tableau de bord → régénérer → `supabase secrets set` → redéployer `delete-account` | suppression de compte HS quelques minutes |
| Webhook RevenueCat | Régénérer la chaîne → `supabase secrets set` → mettre à jour l'en-tête côté RevenueCat | événements perdus entre les deux |
| Supabase `service_role` | Tableau de bord Supabase → rotation | **redéployer toutes les Edge Functions** |
| Compte de service Google | Créer une nouvelle clé → importer dans RevenueCat → supprimer l'ancienne | aucun si l'ordre est respecté |
| Keystore d'upload | Demande de réinitialisation dans Play Console | quelques jours d'attente |
| Clés publiques | Régénérer dans RevenueCat → nouveau build | **impose une mise à jour de l'app** |

Règle : **créer la nouvelle avant de révoquer l'ancienne**, toujours.
