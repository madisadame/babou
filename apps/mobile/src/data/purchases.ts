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

// Issue d'une opération d'achat. On DISTINGUE les cas au lieu de tout réduire
// à un booléen : auparavant un produit indisponible, une annulation et une
// panne StoreKit se ressemblaient tous — le bouton semblait ne rien faire, ce
// qu'Apple rejette et qui rend le diagnostic impossible.
export type ResultatAchat =
  // L'abonnement est actif à l'issue de l'opération.
  | { statut: 'succes' }
  // L'utilisateur a fermé la feuille de paiement : normal, on n'alerte pas.
  | { statut: 'annule' }
  // Rien à restaurer sur ce compte.
  | { statut: 'aucun' }
  // Le module n'est pas configuré (clé absente, ou Expo Go).
  | { statut: 'non_configure' }
  // L'offre ou le package est introuvable côté RevenueCat / App Store Connect.
  | { statut: 'indisponible'; detail: string }
  // Toute autre erreur : le message vient du SDK et doit être montré.
  | { statut: 'erreur'; message: string; code?: string };

// Extrait un message exploitable d'une erreur du SDK RevenueCat.
function decrire(erreur: unknown): { message: string; code?: string; annule: boolean } {
  const e = erreur as {
    message?: string;
    userCancelled?: boolean;
    code?: string | number;
    underlyingErrorMessage?: string;
  } | null;
  return {
    message: e?.underlyingErrorMessage || e?.message || String(erreur),
    code: e?.code === undefined ? undefined : String(e.code),
    annule: Boolean(e?.userCancelled),
  };
}

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
// `probleme` explique une liste vide : sans lui, un paywall sans prix était
// indiscernable d'un paywall dont les prix n'ont simplement pas encore chargé.
export type Offres = { plans: SubscriptionPlan[]; probleme?: string };

export async function getPlans(): Promise<Offres> {
  if (!purchasesConfigured) {
    return { plans: [], probleme: 'achats non configurés (clé absente ou Expo Go)' };
  }
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) {
      return { plans: [], probleme: "aucune offre courante définie dans RevenueCat" };
    }
    const plans: SubscriptionPlan[] = [];
    if (current.annual) {
      plans.push({ period: 'yearly', priceLabel: current.annual.product.priceString });
    }
    if (current.monthly) {
      plans.push({ period: 'monthly', priceLabel: current.monthly.product.priceString });
    }
    if (plans.length === 0) {
      const dispos = current.availablePackages.map((pk) => pk.identifier).join(', ') || 'aucun';
      return {
        plans,
        probleme: `offre « ${current.identifier} » sans package $rc_annual ni $rc_monthly (présents : ${dispos})`,
      };
    }
    return { plans };
  } catch (erreur) {
    const { message, code } = decrire(erreur);
    return { plans: [], probleme: code ? `${code} — ${message}` : message };
  }
}

// Lance l'achat d'un plan.
export async function purchasePlan(period: 'monthly' | 'yearly'): Promise<ResultatAchat> {
  if (!purchasesConfigured) return { statut: 'non_configure' };
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) {
      return {
        statut: 'indisponible',
        detail: "aucune offre courante n'est définie dans RevenueCat",
      };
    }
    const pkg = period === 'yearly' ? current.annual : current.monthly;
    if (!pkg) {
      // Cause la plus fréquente : le package n'a pas l'identifiant standard
      // ($rc_annual / $rc_monthly), ou le produit n'est pas disponible dans
      // App Store Connect.
      const dispos = current.availablePackages.map((p) => p.identifier).join(', ') || 'aucun';
      return {
        statut: 'indisponible',
        detail: `package ${period === 'yearly' ? '$rc_annual' : '$rc_monthly'} introuvable (offre « ${current.identifier} » : ${dispos})`,
      };
    }
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return hasActive(customerInfo.entitlements.active)
      ? { statut: 'succes' }
      : { statut: 'erreur', message: "l'achat a abouti mais l'entitlement premium reste inactif" };
  } catch (erreur) {
    const { message, code, annule } = decrire(erreur);
    return annule ? { statut: 'annule' } : { statut: 'erreur', message, code };
  }
}

// Restaure un achat précédent (changement d'appareil, réinstallation).
export async function restorePurchases(): Promise<ResultatAchat> {
  if (!purchasesConfigured) return { statut: 'non_configure' };
  try {
    const info = await Purchases.restorePurchases();
    return hasActive(info.entitlements.active) ? { statut: 'succes' } : { statut: 'aucun' };
  } catch (erreur) {
    const { message, code, annule } = decrire(erreur);
    return annule ? { statut: 'annule' } : { statut: 'erreur', message, code };
  }
}
