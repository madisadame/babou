# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Trois plateformes obligatoires : iOS + Android + Web

Aucune fonctionnalité n'est terminée tant que les **trois** plateformes fonctionnent.
Avant de considérer une tâche comme finie, lancer :

    npm run check   # tsc + expo export ios/android/web

L'export web fait un rendu Node (rendu statique expo-router) : il attrape les
crashs propres au web (ex. `window is not defined` quand du code touche
`window`/`document`/AsyncStorage hors contexte client). Pièges fréquents :

- Le design suppose un fond sombre (ciel étoilé) + texte crème. Sur web, un
  `absoluteFill` ne remplit pas la page → prévoir un fond nuit sur le body
  (`app/+html.tsx`) et le conteneur racine, sinon le texte devient invisible.
- Ne jamais toucher `window`/`document`/AsyncStorage au niveau module sans
  garder `typeof window !== 'undefined'`.
- `expo-file-system` (téléchargement hors-ligne) n'existe pas sur web : dégrader
  proprement, ne pas planter.
- `Alert.alert` ne marche PAS sur web (boîte non affichée, callbacks des boutons
  jamais déclenchés). Utiliser `notify()` / `confirmAction()` de
  `src/lib/dialogs.ts` à la place, jamais `Alert.alert` directement.
