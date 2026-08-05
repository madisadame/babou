// Webhook RevenueCat -> table `public.subscribers`.
//
// Pourquoi : les politiques RLS de Supabase ne peuvent pas interroger RevenueCat
// au moment d'évaluer un accès. On garde donc en base un miroir de l'état
// d'abonnement, que RevenueCat pousse ici à chaque événement.
//
// Déploiement :
//   supabase functions deploy revenuecat-webhook --no-verify-jwt
//   supabase secrets set REVENUECAT_WEBHOOK_SECRET='<une longue chaîne au hasard>'
//
// `--no-verify-jwt` est nécessaire : RevenueCat n'envoie pas de JWT Supabase.
// L'authentification se fait par l'en-tête `Authorization`, à renseigner dans
// RevenueCat (Project settings -> Integrations -> Webhooks -> Authorization
// header) avec exactement la même valeur que le secret ci-dessus.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const WEBHOOK_SECRET = Deno.env.get('REVENUECAT_WEBHOOK_SECRET') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
// Clé service : contourne la RLS. `subscribers` n'a aucune politique d'écriture,
// donc c'est le seul chemin possible pour renseigner un abonnement.
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const ENTITLEMENT = 'premium';

// Événements qui coupent l'accès immédiatement. Pour tous les autres
// (CANCELLATION comprise : l'abonné garde l'accès jusqu'à l'échéance), c'est la
// date d'expiration qui tranche.
const REVOKING = new Set(['EXPIRATION', 'SUBSCRIPTION_PAUSED']);

// Comparaison à temps constant : évite de laisser fuiter le secret octet par
// octet via le temps de réponse.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // 1. Authentification du webhook.
  if (!WEBHOOK_SECRET) {
    console.error('REVENUECAT_WEBHOOK_SECRET absent — webhook refusé.');
    return new Response('Not configured', { status: 500 });
  }
  const auth = req.headers.get('Authorization') ?? '';
  if (!safeEqual(auth, WEBHOOK_SECRET)) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 2. Lecture de l'événement.
  let payload: Record<string, any>;
  try {
    payload = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const event = payload?.event;
  if (!event) return new Response('No event', { status: 400 });

  const type: string = event.type ?? '';
  // `app_user_id` = l'identifiant passé à Purchases.configure(), donc l'UUID
  // Supabase (cf. configurePurchases dans src/data/purchases.ts).
  const appUserId: string = event.app_user_id ?? '';

  // Les achats anonymes ($RCAnonymousID:…) ne correspondent à aucun compte :
  // rien à écrire. On répond 200 pour que RevenueCat ne réessaie pas.
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!isUuid.test(appUserId)) {
    console.log(`Ignoré (app_user_id non-UUID) : ${appUserId} / ${type}`);
    return new Response(JSON.stringify({ ok: true, skipped: 'anonymous' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 3. L'entitlement « premium » est-il concerné ?
  const entitlements: string[] = event.entitlement_ids ??
    (event.entitlement_id ? [event.entitlement_id] : []);
  if (entitlements.length > 0 && !entitlements.includes(ENTITLEMENT)) {
    console.log(`Ignoré (autre entitlement) : ${entitlements.join(',')}`);
    return new Response(JSON.stringify({ ok: true, skipped: 'entitlement' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 4. Actif ou non ?
  const expiresAt = event.expiration_at_ms
    ? new Date(Number(event.expiration_at_ms))
    : null;
  const expired = expiresAt !== null && expiresAt.getTime() <= Date.now();
  const active = !REVOKING.has(type) && !expired;

  // 5. Écriture du miroir.
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  const { error } = await supabase.from('subscribers').upsert(
    {
      user_id: appUserId,
      entitlement: ENTITLEMENT,
      active,
      expires_at: expiresAt?.toISOString() ?? null,
      product_id: event.product_id ?? null,
      store: event.store ?? null,
      event_type: type,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  if (error) {
    // 500 => RevenueCat rejouera l'événement. C'est ce qu'on veut : mieux vaut
    // un doublon (l'upsert est idempotent) qu'un abonnement perdu.
    console.error('Échec upsert subscribers :', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  console.log(`${type} -> ${appUserId} actif=${active} expire=${expiresAt?.toISOString() ?? '—'}`);
  return new Response(JSON.stringify({ ok: true, active }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
