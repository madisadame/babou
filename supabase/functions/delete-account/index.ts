// Suppression de compte : RevenueCat PUIS Supabase.
//
// Pourquoi cette fonction existe : Google Play (et le RGPD) exigent que la
// suppression d'un compte efface aussi les données détenues par les
// sous-traitants. `delete_own_account` ne supprime que la base Supabase ; le
// Customer RevenueCat, lui, survivait à la suppression du compte.
//
// La clé secrète RevenueCat ne doit JAMAIS être embarquée dans l'application :
// elle donne un accès complet au projet RevenueCat. Elle ne vit que dans les
// secrets Supabase, et n'est lue que côté serveur, ici.
//
// Déploiement :
//   bash supabase/deployer-suppression.sh
//
// Contrairement au webhook, cette fonction est déployée SANS `--no-verify-jwt` :
// la passerelle Supabase valide le JWT avant même d'exécuter ce code. Un appel
// sans jeton valide n'arrive jamais jusqu'ici.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
// Clé « secrète » RevenueCat (Project settings -> API keys -> Secret key).
// À ne pas confondre avec les clés publiques appl_… / goog_… du client.
const RC_SECRET = Deno.env.get('REVENUECAT_SECRET_API_KEY') ?? '';

// L'app tourne aussi sur le web : le navigateur envoie un préflight OPTIONS.
// L'authentification passe par un jeton Bearer et non par un cookie, donc
// autoriser toute origine n'expose rien : sans JWT valide, la passerelle refuse.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// Codes RevenueCat signifiant « il ne reste aucun Customer pour cet identifiant ».
//
// Établi expérimentalement le 2026-08-30 sur des comptes jetables, API v1 :
//
//   Customer présent          DELETE -> 200  {"app_user_id":"…","deleted":true}
//   Customer jamais créé      DELETE -> 404  {}
//   Juste après une suppression, brève fenêtre
//                             DELETE -> 200  {"deleted":true}   (transitoire)
//   La même, ~45 s plus tard  DELETE -> 404  {}                 (état stable)
//
// 200 et 404 attestent donc tous deux l'absence de Customer : l'un parce qu'on
// vient de le supprimer, l'autre parce qu'il n'y en a pas. Les traiter comme un
// succès rend l'opération idempotente, ce qui permet à un utilisateur dont la
// suppression Supabase a échoué de réessayer et d'aboutir.
//
// TOUT autre code reste fail-closed. En particulier 401 (clé invalide ou
// révoquée) ne doit JAMAIS passer pour un succès : ce serait sauter
// silencieusement la suppression chez le sous-traitant, exactement ce que
// l'exigence Google interdit.
const RC_SUCCES = new Set<number>([200, 404]);

Deno.serve(async (req) => {
  // 1. Préflight CORS (web).
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  // 2. Identification de l'utilisateur.
  //
  // L'UUID vient EXCLUSIVEMENT du jeton, jamais du corps de la requête : sinon
  // n'importe quel compte authentifié pourrait faire supprimer le Customer
  // RevenueCat d'un autre. Le corps de la requête est ignoré, sans exception.
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return json({ error: 'missing_token' }, 401);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (userError || !userId) {
    return json({ error: 'invalid_token' }, 401);
  }

  // 3. Configuration. Contrôlé APRÈS l'authentification : inutile de révéler
  // l'état de configuration du serveur à un appelant non authentifié.
  if (!RC_SECRET) {
    console.error('REVENUECAT_SECRET_API_KEY absent — suppression refusée.');
    return json({ error: 'not_configured' }, 500);
  }

  // 4. RevenueCat D'ABORD.
  //
  // L'ordre n'est pas un détail. Si Supabase était supprimé en premier et que
  // RevenueCat échouait, le compte serait perdu et l'utilisateur n'aurait plus
  // aucun moyen de réessayer de façon authentifiée : un orphelin permanent chez
  // le sous-traitant, soit exactement la suppression partielle silencieuse que
  // Google interdit.
  //
  // Dans cet ordre, un échec RevenueCat laisse TOUT intact et réessayable.
  //
  // `app_user_id` = l'UUID Supabase : c'est la valeur passée à
  // Purchases.configure({ appUserID }) côté client, et celle que le webhook
  // reçoit dans event.app_user_id.
  let rcStatus: number;
  let rcBody: string;
  try {
    const rcRes = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${RC_SECRET}`,
          'Content-Type': 'application/json',
        },
      },
    );
    rcStatus = rcRes.status;
    rcBody = (await rcRes.text()).slice(0, 300);
  } catch (e) {
    // Réseau injoignable : on ne supprime rien.
    console.error('RevenueCat injoignable :', (e as Error).message);
    return json({ error: 'revenuecat_unreachable', step: 'revenuecat' }, 502);
  }

  if (!RC_SUCCES.has(rcStatus)) {
    // Échec explicite : le compte Supabase reste INTACT. L'utilisateur voit une
    // erreur et peut réessayer. `rc_status` est renvoyé pour diagnostic — il ne
    // contient aucun secret, seulement le code de retour de l'API.
    console.error(`RevenueCat DELETE ${rcStatus} pour ${userId} : ${rcBody}`);
    return json(
      { error: 'revenuecat_delete_failed', step: 'revenuecat', rc_status: rcStatus },
      502,
    );
  }

  // 5. Supabase ENSUITE, et seulement si RevenueCat a réellement réussi.
  //
  // On réutilise la RPC existante plutôt que la clé service : elle s'exécute
  // avec le JWT de l'utilisateur, ne peut donc supprimer que lui-même, et son
  // SECURITY DEFINER déclenche les cascades ON DELETE sur toutes les tables
  // liées. Moindre privilège : cette fonction n'a jamais besoin de la clé
  // service_role.
  const { error: delError } = await supabase.rpc('delete_own_account');
  if (delError) {
    // RevenueCat est déjà supprimé mais pas Supabase. Cas récupérable et
    // auto-réparant : au prochain essai RevenueCat répondra « déjà supprimé »
    // et la suppression s'achèvera. On le journalise pour ne rien perdre.
    console.error(`Supabase delete_own_account a échoué pour ${userId} : ${delError.message}`);
    return json(
      { error: 'supabase_delete_failed', step: 'supabase', detail: delError.message },
      500,
    );
  }

  console.log(`Compte supprimé : ${userId} (RevenueCat ${rcStatus})`);
  return json({ ok: true, revenuecat_status: rcStatus }, 200);
});
