#!/usr/bin/env bash
# Déploie l'Edge Function revenuecat-webhook sur le projet Supabase de Babou.
#
# À lancer depuis un VRAI terminal (app Terminal), où `supabase login` a été
# fait : le flux d'authentification de la CLI ne fonctionne pas dans un shell
# non interactif, et le jeton n'est pas lisible depuis un autre processus.
#
#   bash supabase/deployer-webhook.sh
#
# On passe --project-ref plutôt que `supabase link` : lier le projet
# réclamerait le mot de passe de la base, dont le déploiement n'a pas besoin.

set -euo pipefail

PROJECT_REF="xjmjdwxmszfqnhdtnnru"
SECRET_FILE="/tmp/rc-secret.txt"

cd "$(dirname "$0")/.."

if [ ! -s "$SECRET_FILE" ]; then
  echo "Secret absent, j'en génère un nouveau dans $SECRET_FILE"
  openssl rand -base64 48 | tr -d '\n=+/' | head -c 48 > "$SECRET_FILE"
fi

echo "▶ 1/2  Enregistrement du secret du webhook"
npx supabase secrets set \
  --project-ref "$PROJECT_REF" \
  REVENUECAT_WEBHOOK_SECRET="$(cat "$SECRET_FILE")"

echo "▶ 2/2  Déploiement de la fonction"
# --no-verify-jwt : RevenueCat n'envoie pas de JWT Supabase. L'authentification
# est faite dans la fonction elle-même, par comparaison de l'en-tête
# Authorization avec le secret ci-dessus.
npx supabase functions deploy revenuecat-webhook \
  --project-ref "$PROJECT_REF" \
  --no-verify-jwt

echo ""
echo "✅ Déployé."
echo "URL : https://$PROJECT_REF.supabase.co/functions/v1/revenuecat-webhook"
