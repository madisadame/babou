# Politique de mise à jour — Babou

## La règle qui prime

Une application publiée qui fonctionne vaut mieux qu'une application à jour qui
plante. Chaque mise à jour est un risque : elle doit être justifiée par un
bénéfice réel, pas par le confort d'un numéro de version récent.

## Contraintes du projet

- **Node 22**, fixé par `.nvmrc`. Les versions plus récentes cassent le
  démarrage d'Expo.
- **Trois plateformes obligatoires.** Rien n'est terminé tant qu'iOS, Android et
  web ne fonctionnent pas : `cd apps/mobile && npm run check`.
- **`expo-asset` et `expo-constants` sont épinglés** par `overrides`. Ne pas les
  déverrouiller sans relire `decisions.md` du 2026-08-09 : un doublon de version
  avait figé l'app sur l'écran de démarrage, en production, de façon invisible
  en développement.

## Comment décider

Avant toute mise à jour, une seule question : **le paquet arrive-t-il dans le
bundle, ou seulement au moment du build ?**

```
npm ls <paquet>
```

Une vulnérabilité dans `metro`, `postcss`, `@expo/cli` ou `xcode` touche la
machine de build, pas les téléphones des utilisateurs. Elle est réelle mais son
exploitation suppose déjà un accès à l'environnement de build. Une vulnérabilité
dans une dépendance de `expo-router` ou `react-native` voyage, elle, dans chaque
installation.

Cette distinction change tout dans la priorisation, et c'est elle qui manque
dans la plupart des rapports `npm audit`.

## Procédure

1. `npm audit` — classer par gravité **et** par portée (runtime / build).
2. Traiter d'abord ce qui atteint le bundle.
3. **Une mise à jour à la fois.** Un lot qui casse ne dit pas quel paquet est
   coupable.
4. `npm run check` après chaque.
5. Pour un paquet touchant le natif ou le démarrage, un build `preview` et un
   essai sur appareil réel.
6. Commit séparé, message expliquant **pourquoi**.

## Ce qu'il ne faut pas faire

**`npm audit fix --force`.** Elle applique des changements de version majeure
sans discernement. Sur ce projet, elle proposerait de rétrograder `expo` — ce
qui casserait tout.

**Suivre Expo SDK dès sa sortie.** Attendre les premiers correctifs. Une montée
de SDK touche le natif des trois plateformes en une fois.

**Mettre à jour juste avant une publication.** Le pire moment : le délai de
revue empêche de corriger vite.

## Cas particulier : les vulnérabilités sans correctif atteignable

Exemple constaté au 2026-09-02 : `decode-uri-component@0.2.2` (ReDoS, MOYENNE)
arrive dans le bundle via `query-string@7.1.3` ← `expo-router`.

Un `overrides` vers `0.3.0` a été **tenté puis annulé** : npm conserve la
version transitive en la marquant « invalid », et forcer davantage risquait de
casser la navigation — le cœur de l'application — pour un déni de service
déclenchable seulement par un lien profond malveillant.

Décision : **attendre qu'`expo-router` monte sa propre dépendance**. C'est le
bon arbitrage quand le correctif coûte plus que le risque qu'il couvre. À
réévaluer à chaque montée d'Expo.

## Rythme

- **Hebdomadaire** : lire les alertes Dependabot.
- **Mensuel** : `npm audit`, décider quoi traiter.
- **Par SDK Expo** : lire les notes de version en entier avant de décider.
- **Immédiat** : uniquement pour une CVE critique atteignant réellement le
  bundle, ou une dépendance compromise.
