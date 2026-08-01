#!/usr/bin/env bash
# Vérification de compatibilité iOS + Android + Web.
# À lancer avant de considérer une tâche comme terminée.
#
#   npm run check          (depuis apps/mobile)
#
# - tsc : types corrects sur tout le code.
# - expo export web : fait un rendu statique côté Node → attrape les crashs
#   spécifiques au web (ex. « window is not defined »), invisibles sur mobile.
# - expo export ios/android : vérifie que le bundle se résout sur chaque natif.
set -euo pipefail

cd "$(dirname "$0")/.."
OUT="$(mktemp -d)/babou-check"
trap 'rm -rf "$OUT"' EXIT

echo "▶ 1/2  TypeScript (tsc --noEmit)"
npx tsc --noEmit -p .

echo "▶ 2/2  Bundle iOS + Android + Web (expo export)"
npx expo export --platform ios --platform android --platform web --output-dir "$OUT" >/dev/null

echo ""
echo "✅ OK — iOS, Android et Web compilent tous les trois."
