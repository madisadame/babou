# Fiche App Store — Babou

Textes prêts à coller dans App Store Connect. Les limites de caractères d'Apple
sont indiquées ; les compteurs correspondent aux textes ci-dessous.

Langue principale : **français**. À traduire plus tard si tu ouvres d'autres
marchés — une seule langue suffit pour publier.

---

## Informations générales

| Champ | Valeur |
|---|---|
| Nom (30 max) | `Babou` |
| Sous-titre (30 max) | `Apprendre le fiqh, pas à pas` — 28 car. |
| Bundle ID | `com.hournews.babou` |
| SKU | `babou-ios-001` |
| Catégorie principale | Éducation |
| Catégorie secondaire | Références (facultatif) |
| Classe d'âge | 4+ |
| Droits d'auteur | `2026 hournews` |
| Assistance | https://madisadame.github.io/babou/confidentialite.html |
| Confidentialité | https://madisadame.github.io/babou/confidentialite.html |
| Contact | admin@hournews.fr |

> ⚠️ **À vérifier avant tout** : le nom « Babou » est-il disponible ? Les noms
> sont uniques au niveau mondial sur l'App Store. S'il est pris, il faut trancher
> tôt — ça touche la fiche, les captures et l'icône.

---

## Texte promotionnel (170 max)

Modifiable à tout moment sans nouvelle version — c'est le champ à utiliser pour
annoncer un nouveau livre.

```
Des leçons courtes en arabe, traduites en français et en shimaoré, avec l'audio
et un quiz à la fin. Apprends à ton rythme, même sans connexion.
```

*152 caractères.*

---

## Description (4000 max)

```
Babou accompagne l'apprentissage du fiqh selon l'école shâfi'ite, pas à pas,
dans un format pensé pour tenir dans une journée ordinaire.

CE QUE TU Y TROUVES

Des livres découpés en chapitres courts. Chaque leçon présente le texte arabe
accompagné de sa traduction en français et en shimaoré, avec une explication
quand le passage le demande.

L'AUDIO POUR L'OREILLE

Chaque passage peut être écouté : la récitation en arabe d'un côté, la
traduction de l'autre. La vitesse est réglable de 0,75× à 2× sans déformer la
voix, et la lecture continue quand tu verrouilles ton téléphone.

COMPRENDRE, PAS SEULEMENT LIRE

Un quiz clôt chaque chapitre. Les questions ratées reviennent plus tard, celles
que tu maîtrises s'espacent — tu révises ce qui en a besoin, pas le reste. Un
quiz final reprend l'ensemble d'un livre quand tu l'as parcouru.

À TON RYTHME

Babou retient où tu t'es arrêté et te ramène au bon endroit. Tu fixes un
objectif quotidien de 5 à 20 minutes, et l'application compte les jours
d'affilée où tu as étudié. Aucun classement, aucune comparaison avec les
autres : la régularité est une affaire personnelle.

MODE RÉCITATION

Le texte arabe se masque d'un geste, la traduction reste comme indice. Utile
pour vérifier ce qui est réellement acquis.

HORS CONNEXION

Un livre téléchargé se lit partout, audio compris. Pratique dans les transports
ou là où le réseau manque.

CONFORT DE LECTURE

Taille du texte ajustable, marque-pages sur les passages à retrouver, recherche
dans la bibliothèque.

TON COMPTE

Marque-pages, progression, révisions et préférences suivent d'un appareil à
l'autre dès que tu es connecté.

BABOU EST UN COMPLÉMENT

Cette application ne remplace pas un enseignant. Elle sert à réviser, à
consolider et à garder le fil entre deux cours.

ABONNEMENT

Un livre est en accès libre pour découvrir l'application. L'abonnement ouvre
toute la bibliothèque et les livres à venir. La première semaine est offerte.
```

*Environ 1 750 caractères.*

---

## Mots-clés (100 max, séparés par des virgules)

```
islam,shafi,coran,sunna,priere,apprendre,cours,shimaore,mayotte,comores,musulman,religion,arabe
```

*94 caractères.*

Notes :
- « fiqh » est volontairement absent : il figure déjà dans le sous-titre, qu'Apple
  indexe. L'y répéter gaspillerait des caractères.
- Pas d'espace après les virgules (ils comptent).
- Pas d'accents : les recherches accentuées et non accentuées se rejoignent.

---

## Notes pour l'équipe de revue

À remplir dans « Informations de la revue ». **Indispensable** : sans compte de
démonstration, une app dont le contenu est derrière un abonnement est rejetée.

```
Bonjour,

Babou est une application d'apprentissage du fiqh (jurisprudence islamique)
destinée au public francophone, avec une traduction en shimaoré.

COMPTE DE DÉMONSTRATION
Identifiant : <e-mail du compte de test>
Mot de passe : <mot de passe>
Ce compte dispose d'un accès complet au catalogue.

ACCÈS SANS COMPTE
Un livre (« Avant-propos ») est consultable sans inscription ni abonnement, afin
que l'application soit évaluable même sans se connecter.

ABONNEMENT
L'accès au reste du catalogue passe par un abonnement auto-renouvelable
(mensuel ou annuel) avec une semaine d'essai gratuite, géré par les achats
intégrés. Les liens vers les conditions d'utilisation (EULA standard Apple) et
la politique de confidentialité figurent sur l'écran d'abonnement.

Merci pour votre temps.
```

---

## Captures d'écran

iPhone uniquement (`supportsTablet: false`), donc **une seule taille obligatoire** :
6,9 pouces. Apple redimensionne pour les tailles inférieures.

Ordre suggéré — la première est celle qu'on voit dans les résultats de recherche :

1. Un chapitre ouvert, texte arabe et traduction visibles
2. La bibliothèque, ciel étoilé et cartes de livres
3. Le lecteur audio avec la récitation en cours
4. Un quiz en cours
5. La carte de régularité (série de jours + objectif)

À produire depuis un simulateur iPhone, pas depuis le web : le rendu diffère.

---

## Confidentialité de l'app

Le questionnaire « Confidentialité de l'app » est obligatoire. Ce que Babou
collecte réellement :

| Donnée | Usage | Liée à l'identité |
|---|---|---|
| Adresse e-mail | création du compte | oui |
| Progression, marque-pages, préférences | fonctionnement de l'app | oui |
| Achats | gestion de l'abonnement | oui |

Aucun suivi publicitaire, aucun partage avec des tiers à des fins marketing.
Répondre **non** à « suivi » (tracking).
