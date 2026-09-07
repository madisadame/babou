#!/usr/bin/env bash
# Sauvegarde de la base Supabase de Babou.
#
#   bash scripts/backup-production.sh
#
# Ce script ne contient AUCUN secret. Il lit la chaîne de connexion dans la
# variable d'environnement SUPABASE_DB_URL, que vous fournissez au lancement
# sans qu'elle passe par l'historique du shell :
#
#   read -rs SUPABASE_DB_URL && export SUPABASE_DB_URL
#   bash scripts/backup-production.sh
#
# La chaîne se trouve dans Supabase → Project Settings → Database →
# Connection string → URI (mode "Session", port 5432). Prenez le pooler
# (port 6543) si le direct est bloqué par votre réseau.
#
# POURQUOI pg_dump et pas backend/export.mjs : export.mjs passe par l'API REST
# et ne voit que ce que PostgREST expose. pg_dump produit un dump logique
# complet — schéma, contraintes, index, fonctions, politiques RLS — donc
# réellement restaurable. C'est la différence entre une copie des données et
# une sauvegarde.

set -euo pipefail

DEST="${BABOU_BACKUP_DEST:-/Volumes/Verbatim HD/Sauvegardes/Babou/Supabase}"
TS="$(date -u +%Y%m%dT%H%M%SZ)"
DUMP="$DEST/database/babou-$TS.dump"
MANIFESTE="$DEST/manifests/database-$TS.txt"
JOURNAL="$DEST/logs/database-$TS.log"

if [ -z "${SUPABASE_DB_URL:-}" ]; then
  cat >&2 <<'MSG'
❌ SUPABASE_DB_URL absente.

   Récupérez-la dans Supabase → Project Settings → Database → Connection
   string → URI, puis, sans la laisser dans l'historique :

     read -rs SUPABASE_DB_URL && export SUPABASE_DB_URL
     bash scripts/backup-production.sh
MSG
  exit 1
fi

command -v pg_dump >/dev/null || { echo "❌ pg_dump absent (brew install postgresql@17)" >&2; exit 1; }

if [ ! -d "$DEST" ]; then
  echo "❌ Destination introuvable : $DEST" >&2
  echo "   Le disque externe est-il monté ?" >&2
  exit 1
fi

mkdir -p "$DEST"/{database,storage,manifests,logs}
chmod 700 "$DEST" "$DEST"/{database,storage,manifests,logs}

echo "▶ 1/4  Dump de la base"
# --format=custom : compressé, et restaurable sélectivement par pg_restore.
# --no-owner / --no-privileges : les rôles Supabase n'existent pas sur une
#   instance vierge ; les réclamer ferait échouer la restauration.
# Schémas exclus, et pourquoi :
#   storage      -> métadonnées d'objets sans les octets ; les fichiers sont
#                   sauvegardés séparément (voir storage/), un dump partiel
#                   donnerait une fausse impression de complétude.
#   auth         -> conservé au contraire : sans lui, plus aucun compte, et
#                   toutes les clés étrangères user_id deviennent orphelines.
#   extensions, graphql, pgbouncer, realtime, vault, supabase_functions,
#   pgsodium     -> gérés par la plateforme, recréés à l'initialisation.
pg_dump "$SUPABASE_DB_URL" \
  --format=custom \
  --no-owner --no-privileges \
  --schema='public' --schema='auth' \
  --exclude-schema='storage' \
  --file="$DUMP" 2> >(tee -a "$JOURNAL" >&2)

echo "▶ 2/4  Empreinte"
SHA="$(shasum -a 256 "$DUMP" | cut -d' ' -f1)"
TAILLE="$(stat -f%z "$DUMP")"

echo "▶ 3/4  Contrôle de lisibilité"
# Une sauvegarde qu'on n'a pas relue n'est pas une sauvegarde. pg_restore
# --list échoue si l'archive est tronquée ou corrompue.
TABLES="$(pg_restore --list "$DUMP" | grep -c 'TABLE DATA' || true)"
OBJETS="$(pg_restore --list "$DUMP" | grep -cE '^[0-9]' || true)"
[ "$TABLES" -gt 0 ] || { echo "❌ Archive illisible ou vide" >&2; exit 1; }

echo "▶ 4/4  Manifeste"
VERSION="$(psql "$SUPABASE_DB_URL" -tAc 'select version()' 2>/dev/null | head -1 || echo 'inconnue')"
cat > "$MANIFESTE" <<EOF
# Sauvegarde base Babou
date_utc      : $TS
fichier       : $(basename "$DUMP")
format        : pg_dump custom (restaurable par pg_restore)
taille_octets : $TAILLE
sha256        : $SHA
tables_donnees: $TABLES
objets_archive: $OBJETS
postgres      : $VERSION
pg_dump       : $(pg_dump --version)
schemas       : public, auth
exclus        : storage (objets sauvegardés à part), schémas gérés par la plateforme
EOF

chmod 600 "$DUMP" "$MANIFESTE" "$JOURNAL" 2>/dev/null || true

echo ""
echo "✅ Sauvegarde terminée"
echo "   $DUMP"
echo "   $TAILLE octets · $TABLES tables · sha256 ${SHA:0:16}…"
echo ""
echo "⚠️  Ce dump contient les adresses e-mail des inscrits."
echo "   Il ne doit jamais entrer dans Git ni quitter le disque chiffré."
