# Sauvegardes et restauration — Babou

État vérifié au 2026-09-02.

## Le tableau honnête

| Élément | Copie principale | Copie externe | Copie distante | 3-2-1 ? |
|---|---|---|---|---|
| Code source | poste local | — | GitHub `madisadame/babou` | **partiel** — 2 copies |
| Base Supabase | Supabase (offre gratuite) | — | — | **NON** |
| Storage `media` | Supabase | — | — | **NON** |
| Keystore Android | — | Verbatim `Android-signing/` | EAS (serveurs Expo) | **oui** |
| Compte de service Google | — | Verbatim `Google-Play-service-account/` | Google Cloud | **oui** |
| Clé Apple `.p8` | — | à vérifier | Apple | à compléter |
| Documentation | poste local | — | GitHub | partiel |
| Identifiants EAS | — | Verbatim | EAS | oui |

**Le point noir est la base de données.** L'offre gratuite Supabase ne fait
**aucune sauvegarde automatique**. Le contenu — livres, chapitres, segments
traduits, quiz — représente un travail considérable qu'une fausse manœuvre
effacerait sans retour.

`backend/export.mjs` existe et couvre le besoin, mais son exécution est
**manuelle**. C'était un report assumé, documenté dans `decisions.md` le
2026-08-12 ; il reste la première faiblesse du dispositif.

## Sauvegarder la base

Depuis la racine, avec la clé service exportée dans le shell — jamais dans un
fichier versionné :

```
read -rs SUPABASE_SERVICE_ROLE_KEY && export SUPABASE_SERVICE_ROLE_KEY
node backend/export.mjs
```

La sortie va dans `backups/`, ignoré par Git — **elle contient les adresses
e-mail des inscrits**. À copier ensuite sur le Verbatim, jamais ailleurs.

Rythme recommandé : avant chaque migration, avant chaque livraison, et une fois
par mois.

## Storage

Aucune sauvegarde. Contenu actuel : 7 fichiers, 281 Ko — dont cinq de 0 octet
au nom corrompu. La perte serait aujourd'hui négligeable ; elle cessera de
l'être dès le premier audio téléversé.

## Restauration

**Jamais directement en production.** L'ordre correct :

1. Créer un projet Supabase de test.
2. Y rejouer `backend/schema.sql`, puis les migrations dans l'ordre des dates.
3. Importer l'export.
4. Vérifier avec `node backend/verifier-schema.mjs`.
5. Contrôler quelques lignes à la main.
6. Seulement alors, envisager la production — et avec un export frais pris
   juste avant.

## Ce qui est réellement testé

- **Keystore Android** : validé par comparaison d'empreinte SHA-256 entre le
  certificat sauvegardé et celui des AAB versionCode 2 et 3. Identiques.
- **Code** : `git` garantit l'intégrité par construction ; GitHub est à jour.
- **Base** : **jamais restaurée**. C'est une sauvegarde non éprouvée, donc une
  sauvegarde dont on ne sait pas si elle vaut quelque chose.
- **Storage** : aucune sauvegarde, donc rien à tester.

## Ce qu'il faudrait, par ordre d'utilité

1. **Automatiser l'export de la base.** Une tâche planifiée hebdomadaire vers
   le Verbatim. Gratuit, et supprime la plus grosse faiblesse du dispositif.
2. **Tester une restauration** au moins une fois, sur un projet jetable. Une
   sauvegarde jamais restaurée n'est pas une sauvegarde.
3. **Sauvegarder le Storage** dès que des audios y seront déposés.
4. **Copie distante chiffrée** de la base pour compléter le 3-2-1 — le Verbatim
   et le Mac sont au même endroit physique. Un incendie emporterait les deux.
