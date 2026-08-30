#!/usr/bin/env bash
# Déploie l'Edge Function delete-account sur le projet Supabase de Babou.
#
#   bash supabase/deployer-suppression.sh
#
# Cette fonction supprime le Customer RevenueCat AVANT le compte Supabase.
# Elle a donc besoin de la clé « secrète » RevenueCat :
#   RevenueCat -> Project settings -> API keys -> Secret key
#
# ⚠️ Ce n'est PAS une clé publique appl_… / goog_… / test_ : celles-ci sont
# embarquées dans l'application et n'autorisent aucune suppression. La clé
# secrète donne un accès complet au projet RevenueCat — elle ne doit exister
# que dans les secrets Supabase, jamais dans le dépôt ni dans le bundle.
#
# Dépose la clé dans le fichier ci-dessous avant de lancer ce script :
#   SECRET_FILE (hors du dépôt, effacé à ta main après usage)
#
# Contrairement au webhook, on NE passe PAS --no-verify-jwt : la passerelle
# Supabase vérifie le JWT de l'utilisateur avant d'exécuter la fonction.

set -euo pipefail

PROJECT_REF="xjmjdwxmszfqnhdtnnru"
SECRET_FILE="${RC_SECRET_FILE:-/tmp/rc-secret-api-key.txt}"

cd "$(dirname "$0")/.."

if [ ! -s "$SECRET_FILE" ]; then
  cat >&2 <<MSG
❌ Clé secrète RevenueCat absente.

   Récupère-la dans RevenueCat → Project settings → API keys → Secret key,
   puis dépose-la (sans retour à la ligne superflu) dans :

     $SECRET_FILE

   Par exemple, sans qu'elle apparaisse dans l'historique du shell :
     read -rs KEY && printf '%s' "\$KEY" > "$SECRET_FILE" && unset KEY

   Puis relance ce script.
MSG
  exit 1
fi

# Garde-fou : refuse une clé publique passée par erreur.
FIRST5=$(head -c 5 "$SECRET_FILE")
case "$FIRST5" in
  appl_|goog_|test_|amzn_|rcb_p)
    echo "❌ Cette clé ressemble à une clé PUBLIQUE ($FIRST5…). Il faut la clé secrète." >&2
    exit 1
    ;;
esac

echo "▶ 1/2  Enregistrement du secret RevenueCat"
npx supabase secrets set \
  --project-ref "$PROJECT_REF" \
  REVENUECAT_SECRET_API_KEY="$(cat "$SECRET_FILE")"

echo "▶ 2/2  Déploiement de la fonction (JWT vérifié par la passerelle)"
npx supabase functions deploy delete-account \
  --project-ref "$PROJECT_REF"

echo ""
echo "✅ Déployé."
echo "URL : https://$PROJECT_REF.supabase.co/functions/v1/delete-account"
echo ""
echo "Pense à effacer $SECRET_FILE :  shred -u \"$SECRET_FILE\" 2>/dev/null || rm -f \"$SECRET_FILE\""
