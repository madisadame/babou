# Surveillance et alertes — Babou

État au 2026-09-02. Ce document dit **ce que nous détectons réellement**, et
surtout ce que nous ne détectons pas.

## Avertissement, à lire en premier

Nous ne détectons **pas** « toute tentative de piratage ». Personne ne le fait.
Ce que nous avons, ce sont quelques capteurs sur des points précis, avec des
délais variables et de vrais angles morts. Les connaître vaut mieux que de se
croire couvert.

## Ce qui est actif aujourd'hui

| Capteur | Ce qu'il voit | Où arrive l'alerte | Délai |
|---|---|---|---|
| **GitHub secret scanning** | un secret poussé dans le dépôt | e-mail au propriétaire + onglet Security | minutes |
| **GitHub push protection** | bloque le push **avant** qu'il n'arrive | erreur immédiate dans le terminal | immédiat |
| **Dependabot alerts** | CVE dans une dépendance | e-mail + onglet Security | heures à jours |
| **Dependabot security updates** | ouvre une PR de correctif | GitHub | jours |
| **Protection de branche `main`** | refuse force-push et suppression | erreur au push | immédiat |
| Journaux Edge Functions | erreurs de `delete-account` et du webhook | tableau de bord Supabase, **consultation manuelle** | aucun envoi |
| Journaux Auth Supabase | échecs de connexion | tableau de bord, **consultation manuelle** | aucun envoi |
| Tableau de bord RevenueCat | achats, événements, erreurs de livraison webhook | interface, **consultation manuelle** | aucun envoi |

Les quatre premières lignes **poussent** une alerte vers toi. Les trois
dernières exigent que tu ailles regarder : ce sont des journaux, pas des
alertes.

## Ce que nous ne détectons pas

C'est la partie importante.

- **Brute-force sur l'authentification.** Supabase applique un débit limité,
  mais nous n'avons aucune alerte sur un pic de `401`. Une campagne lente
  passerait inaperçue.
- **Pics de 401/403 sur l'API.** Aucun capteur. L'offre gratuite Supabase
  n'expose pas de métriques exploitables pour de l'alerting.
- **Fuite d'un secret serveur** (clé service, clé RevenueCat secrète). Rien ne
  la détecterait : ces clés ne sont pas dans le dépôt, donc le secret scanning
  de GitHub ne les voit pas. Une fuite se manifesterait par ses effets —
  abonnements fantômes, données modifiées.
- **Accès administrateur inhabituel.** Aucune journalisation applicative des
  actions d'admin. `set_user_access` ne laisse pas de trace horodatée
  exploitable au-delà de `updated_at`.
- **Modification des politiques RLS.** Aucune alerte. Un changement passerait
  silencieusement.
- **Crash massif après mise à jour.** Aucun outil de suivi d'erreurs. Tu
  l'apprendrais par les avis sur les boutiques, avec plusieurs jours de retard.
- **Indisponibilité de Supabase.** Aucune sonde. À surveiller sur la page
  d'état de Supabase.
- **Échec de livraison du webhook RevenueCat.** RevenueCat réessaie et affiche
  les échecs dans son interface, mais ne nous envoie rien.
- **Trafic anormal / DDoS.** Absorbé par l'infrastructure Supabase, invisible
  pour nous.

## Ce qui manque le plus

Par ordre d'utilité réelle :

1. **Suivi des erreurs applicatives** (Sentry ou équivalent). C'est le seul
   capteur qui préviendrait d'un crash massif avant les avis négatifs. Offre
   gratuite suffisante à ce volume. **Nécessite ton accord** — création de
   compte externe.
2. **Alerte sur échec du webhook RevenueCat.** RevenueCat peut notifier par
   e-mail les échecs de livraison ; à activer dans son interface.
3. **Sonde de disponibilité** sur `api` Supabase et les Edge Functions. Un
   simple contrôle périodique externe suffirait.

## Vérifications manuelles recommandées

En l'absence d'alertes poussées, quelques regards réguliers valent mieux qu'un
faux sentiment de sécurité.

- **Hebdomadaire** : onglet Security de GitHub ; tableau de bord RevenueCat
  (achats et échecs de webhook).
- **Mensuel** : journaux Auth Supabase (pics d'échecs) ; liste des
  administrateurs via `list_admins()` ; `npm audit`.
- **À chaque livraison** : `npm run check`, et les permissions du manifeste de
  l'AAB.
