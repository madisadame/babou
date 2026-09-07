#!/usr/bin/env bash
# Sauvegarde des objets du bucket Supabase Storage « media ».
#
#   bash scripts/backup-storage.sh
#
# Aucun secret : le bucket est en lecture publique, la clé anon suffit et elle
# est déjà dans apps/mobile/.env.
#
# POURQUOI un script séparé : un dump PostgreSQL ne sauvegarde PAS les octets
# des fichiers. Le schéma `storage` ne contient que des métadonnées. Sans cette
# étape, une restauration rendrait une base qui référence des fichiers absents.

set -euo pipefail

DEST="${BABOU_BACKUP_DEST:-/Volumes/Verbatim HD/Sauvegardes/Babou/Supabase}"
RACINE="$(cd "$(dirname "$0")/.." && pwd)"
TS="$(date -u +%Y%m%dT%H%M%SZ)"

[ -f "$RACINE/apps/mobile/.env" ] || { echo "❌ apps/mobile/.env introuvable" >&2; exit 1; }
set -a; . "$RACINE/apps/mobile/.env"; set +a
[ -d "$DEST" ] || { echo "❌ Destination introuvable : $DEST — disque monté ?" >&2; exit 1; }

mkdir -p "$DEST"/{storage/media,manifests,logs}
chmod 700 "$DEST" "$DEST/storage" "$DEST/storage/media" "$DEST/manifests" "$DEST/logs"

MANIFESTE="$DEST/manifests/storage-$TS.txt"
JOURNAL="$DEST/logs/storage-$TS.log"

python3 - "$DEST" "$MANIFESTE" "$JOURNAL" "$EXPO_PUBLIC_SUPABASE_URL" "$EXPO_PUBLIC_SUPABASE_ANON_KEY" <<'PY'
import hashlib, json, os, sys, urllib.parse, urllib.request

DEST, MANIFESTE, JOURNAL, URL, CLE = sys.argv[1:6]
PREFIXES = ['covers', 'audio']
lignes, total, ok, ko = [], 0, 0, 0

def lister(prefix):
    req = urllib.request.Request(
        f"{URL}/storage/v1/object/list/media",
        data=json.dumps({"prefix": prefix, "limit": 5000}).encode(),
        headers={"apikey": CLE, "Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=60) as r:
        d = json.load(r)
    return d if isinstance(d, list) else []

for prefix in PREFIXES:
    for o in lister(prefix):
        nom = o['name']
        chemin = f"{prefix}/{nom}"
        meta = o.get('metadata') or {}
        src = f"{URL}/storage/v1/object/public/media/{urllib.parse.quote(chemin)}"
        # Un nom contenant « / » ou « : » vient d'un upload corrompu : on le
        # consigne mais on ne peut pas le télécharger, son URL est invalide.
        sur = nom.replace('/', '_').replace(':', '_')
        dossier = os.path.join(DEST, 'storage', 'media', prefix)
        os.makedirs(dossier, exist_ok=True); os.chmod(dossier, 0o700)
        try:
            with urllib.request.urlopen(src, timeout=120) as r:
                data = r.read()
        except Exception as e:
            lignes.append(f"{'-'*64}  {meta.get('size',0):>10}  ILLISIBLE  {chemin}  ({e})")
            ko += 1
            continue
        cible = os.path.join(dossier, sur)
        open(cible, 'wb').write(data); os.chmod(cible, 0o600)
        h = hashlib.sha256(data).hexdigest()
        coherent = meta.get('size') in (None, len(data))
        lignes.append(f"{h}  {len(data):>10}  {'OK      ' if coherent else 'TAILLE! '}  {chemin}")
        total += len(data); ok += 1

entete = (f"# Manifeste Storage — bucket media\n"
          f"# {ok} objet(s) sauvegarde(s), {ko} illisible(s), {total} octets\n"
          f"# sha256  taille  etat  chemin\n")
open(MANIFESTE, 'w').write(entete + "\n".join(lignes) + "\n")
os.chmod(MANIFESTE, 0o600)
open(JOURNAL, 'w').write(entete + "\n".join(lignes) + "\n"); os.chmod(JOURNAL, 0o600)
print(f"✅ {ok} objet(s), {total} octets" + (f" — {ko} illisible(s), voir le manifeste" if ko else ""))
PY
