# Glossaire

Les mots utilisés dans le projet, tels qu'ils désignent les choses aujourd'hui.
Quand un terme correspond à une table ou à une colonne de la base, elle est
indiquée entre parenthèses.

## Contenu

- **Livre** (`books`) : ouvrage découpé en chapitres, rangé dans une catégorie
  (Fiqh, Invocations, Histoires…) et affiché dans la bibliothèque.
- **Chapitre** (`chapters`) : unité de contenu d'un livre, composée d'une leçon
  et d'un quiz. Peut porter un audio couvrant le chapitre entier.
- **Leçon** : le corps d'un chapitre, c'est-à-dire la suite de ses segments.
- **Segment** (`chapter_segments`) : une phrase ou un passage — le texte arabe,
  ses traductions, éventuellement une explication, et les audios associés.
- **Traduction** : version française ou shimaoré du texte arabe d'un segment.
- **Explication** : commentaire libre attaché à un segment, quand le passage
  demande plus qu'une traduction. Française ou shimaoré, écrite et/ou audio.
- **Récitation** : l'audio du texte arabe d'un segment, à distinguer de l'audio
  de la traduction, qui existe séparément pour chaque langue.
- **Timings mot-à-mot** : début et fin de chaque mot dans la récitation, saisis
  dans l'admin en tapant au rythme de l'audio. Ils alimentent le **karaoké** —
  le surlignage du mot en cours de lecture.
- **Brouillon / publié** : un livre ou un chapitre non publié n'est visible que
  des administrateurs. La base applique cette règle, pas seulement l'affichage.
- **Livre vitrine** (`books.showcase`) : le livre laissé ouvert à tous, sans
  compte ni abonnement, pour découvrir l'application. Un seul à la fois
  aujourd'hui ; changer de vitrine est une simple mise à jour en base.

## Quiz et révision

- **Quiz** : série de questions qui clôt un chapitre. Le mot remplace « test »,
  employé au début du projet.
- **Question** (`questions`) : un énoncé, plusieurs choix, une bonne réponse et
  une correction — le tout traduit dans les langues disponibles.
- **Choix** (`question_choices`) : une réponse proposée pour une question.
- **Correction** : l'explication montrée après une réponse. Affichée aussitôt ou
  regroupée à la fin, selon un réglage.
- **Résultat** : nombre de bonnes réponses et taux de réussite d'un quiz.
- **À revoir** : les questions ratées. Elles reviennent en **révision espacée** —
  une question manquée revient vite, une question réussie s'espace.
- **Quiz final** : quiz d'ensemble d'un livre, alimenté au hasard par les
  questions des chapitres déjà travaillés. Sa progression monte à chaque bonne
  réponse et redescend à chaque erreur ; le livre est validé à 100 %.

## Utilisateur

- **Progression de lecture** (`reading_progress`) : les chapitres parcourus,
  synchronisés sur le compte quand l'utilisateur est connecté.
- **Marque-page** : chapitre mis de côté pour y revenir.
- **Reprise de lecture** : retour au dernier chapitre ouvert.
- **Objectif quotidien** : durée d'étude visée chaque jour (5 à 20 minutes).
- **Série** : nombre de jours consécutifs où l'utilisateur a étudié. Elle repart
  de zéro après un jour sauté. Volontairement sans classement ni comparaison
  entre utilisateurs.
- **Mode récitation** : masque le texte arabe, la traduction servant d'indice,
  pour vérifier ce qui est réellement acquis.
- **Hors connexion** : livre téléchargé sur l'appareil, audio compris, lisible
  sans réseau.

## Accès et abonnement

- **Abonnement** : accès auto-renouvelable à toute la bibliothèque, mensuel ou
  annuel, réglé par les achats intégrés Apple ou Google via RevenueCat.
- **Essai** : première semaine offerte, décomptée à partir de la création du
  compte ou de l'activation de l'abonnement, la plus tardive des deux.
- **Accès offert** (`user_access`) : accès complet accordé à la main par un
  administrateur, sans paiement.
- **Paywall** : l'écran qui présente l'abonnement lorsque l'accès est bloqué.
- **Interrupteur d'abonnement** (`app_config`) : tant qu'il est éteint, toute
  l'application reste libre. C'est lui qui déclenche le passage au payant.
- **Espace administrateur** : les écrans réservés aux comptes administrateurs,
  intégrés à l'application (et non un site à part). Ils couvrent la saisie du
  contenu, les médias, les statistiques, l'audience, la liste des
  administrateurs et les accès offerts.

## Termes abandonnés

- **Vidéo de cours** : prévue à l'origine dans la définition d'un chapitre,
  jamais implémentée. Le contenu est aujourd'hui textuel et audio.
- **Achat unique** : le contenu payant est vendu par abonnement depuis le
  2026-07-29, non à l'unité.
- **Pourcentage de maîtrise** : jamais implémenté sous ce nom. Ce qui existe est
  le taux de réussite d'un quiz et la progression du quiz final.
