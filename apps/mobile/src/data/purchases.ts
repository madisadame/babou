// Abstraction des achats intégrés (abonnement) via RevenueCat.
//
// Tant que `react-native-purchases` n'est pas installé et qu'on n'a pas de
// build de développement (RevenueCat ne fonctionne pas dans Expo Go), ce module
// se comporte comme un « stub » : aucun abonnement actif, achats indisponibles.
// Tout le reste de l'app (blocage, essai, déblocage admin) reste testable.
//
// ── Pour activer plus tard ─────────────────────────────────────────────
// 1. `npx expo install react-native-purchases`
// 2. Créer un compte RevenueCat, y déclarer les produits mensuel/annuel et
//    l'« entitlement » nommé `premium`.
// 3. Renseigner les clés publiques RevenueCat (iOS/Android).
// 4. Remplacer les corps de fonctions ci-dessous par les appels réels du SDK
//    (Purchases.configure / getCustomerInfo / getOfferings / purchasePackage /
//    restorePurchases). L'interface exportée ne change pas.

export type SubscriptionPlan = {
  id: string;
  // Prix déjà formaté et localisé par le store (ex. « 9,99 € »).
  priceLabel: string;
  period: 'monthly' | 'yearly';
};

// Passe à true une fois le SDK RevenueCat configuré.
export const purchasesConfigured = false;

// Identifiant de l'« entitlement » RevenueCat qui débloque l'app.
export const PREMIUM_ENTITLEMENT = 'premium';

// À appeler après connexion pour lier les achats au compte (RevenueCat login).
export async function configurePurchases(_userId: string | null): Promise<void> {
  // stub : rien tant que le SDK n'est pas branché.
}

// L'utilisateur a-t-il un abonnement actif ?
export async function hasActiveSubscription(): Promise<boolean> {
  return false;
}

// Offres disponibles (mensuel / annuel).
export async function getPlans(): Promise<SubscriptionPlan[]> {
  return [];
}

// Lance l'achat d'un plan. Retourne true si l'abonnement est actif ensuite.
export async function purchasePlan(_planId: string): Promise<boolean> {
  return false;
}

// Restaure un achat précédent (changement d'appareil, réinstallation).
export async function restorePurchases(): Promise<boolean> {
  return false;
}
