import Constants from 'expo-constants';
import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

// Achats intégrés (abonnement) via RevenueCat.
//
// Les clés « SDK » RevenueCat sont publiques (côté client), donc sûres à
// embarquer. Renseigne-les dans .env :
//   EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxx
//   EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxx
//
// RevenueCat repose sur un module natif : il ne fonctionne PAS dans Expo Go.
// Sans clé ou dans Expo Go, ce module renvoie « pas d'abonnement / pas d'offre »
// sans planter — le reste de l'app (blocage, essai, déblocage admin) reste testable.
//
// Côté tableau de bord RevenueCat, déclare un « entitlement » nommé `premium`
// et une « offering » par défaut contenant les packages mensuel et annuel.

export type SubscriptionPlan = {
  // Période du plan.
  period: 'monthly' | 'yearly';
  // Prix déjà formaté et localisé par le store (ex. « 9,99 € »).
  priceLabel: string;
};

// Identifiant de l'« entitlement » RevenueCat qui débloque l'app.
export const PREMIUM_ENTITLEMENT = 'premium';

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';
const API_KEY = (Platform.select({ ios: IOS_KEY, android: ANDROID_KEY, default: '' }) ?? '').trim();

// Expo Go = 'storeClient' : le module natif RevenueCat n'y est pas disponible.
const inExpoGo = Constants.executionEnvironment === 'storeClient';

// True quand les achats intégrés sont réellement utilisables.
export const purchasesConfigured = Boolean(API_KEY) && !inExpoGo;

let configured = false;

function hasActive(entitlements: Record<string, unknown>): boolean {
  return Boolean(entitlements[PREMIUM_ENTITLEMENT]);
}

// À appeler après connexion/déconnexion pour lier les achats au compte.
export async function configurePurchases(userId: string | null): Promise<void> {
  if (!purchasesConfigured) return;
  try {
    if (!configured) {
      if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.WARN);
      Purchases.configure({ apiKey: API_KEY, appUserID: userId ?? null });
      configured = true;
      return;
    }
    if (userId) {
      await Purchases.logIn(userId);
    } else {
      // Repasse en identité anonyme (ignore l'erreur si déjà anonyme).
      await Purchases.logOut().catch(() => {});
    }
  } catch {
    // configuration indisponible : on reste en mode « pas d'abonnement ».
  }
}

// L'utilisateur a-t-il un abonnement actif ?
export async function hasActiveSubscription(): Promise<boolean> {
  if (!purchasesConfigured) return false;
  try {
    const info = await Purchases.getCustomerInfo();
    return hasActive(info.entitlements.active);
  } catch {
    return false;
  }
}

// Offres disponibles (annuel / mensuel), avec prix localisés par le store.
export async function getPlans(): Promise<SubscriptionPlan[]> {
  if (!purchasesConfigured) return [];
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) return [];
    const plans: SubscriptionPlan[] = [];
    if (current.annual) plans.push({ period: 'yearly', priceLabel: current.annual.product.priceString });
    if (current.monthly) plans.push({ period: 'monthly', priceLabel: current.monthly.product.priceString });
    return plans;
  } catch {
    return [];
  }
}

// Lance l'achat d'un plan. Retourne true si l'abonnement est actif ensuite.
export async function purchasePlan(period: 'monthly' | 'yearly'): Promise<boolean> {
  if (!purchasesConfigured) return false;
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    const pkg = period === 'yearly' ? current?.annual : current?.monthly;
    if (!pkg) return false;
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return hasActive(customerInfo.entitlements.active);
  } catch {
    // inclut l'annulation par l'utilisateur.
    return false;
  }
}

// Restaure un achat précédent (changement d'appareil, réinstallation).
export async function restorePurchases(): Promise<boolean> {
  if (!purchasesConfigured) return false;
  try {
    const info = await Purchases.restorePurchases();
    return hasActive(info.entitlements.active);
  } catch {
    return false;
  }
}
