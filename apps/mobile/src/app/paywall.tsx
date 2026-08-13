import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import {
  getPlans,
  purchasePlan,
  restorePurchases,
  type ResultatAchat,
  type SubscriptionPlan,
} from '@/data/purchases';
import { useAccess } from '@/hooks/use-access';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from '@/hooks/use-translation';

const CREAM = '#F5EEDA';
const GREEN = '#0C5A44';

// Liens légaux requis par Apple (règle 3.1.2) pour un abonnement.
// Mets à jour PRIVACY_URL avec l'URL définitive de la politique une fois hébergée.
const PRIVACY_URL = 'https://madisadame.github.io/babou/confidentialite.html';
const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

// Écran de blocage : proposé quand l'abonnement est activé et que l'utilisateur
// n'a ni abonnement actif, ni accès offert, ni essai en cours. Il offre les
// plans (achat intégré), la restauration d'achat, et la connexion (pour démarrer
// la semaine gratuite ou retrouver un abonnement lié au compte).
export default function PaywallScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { trialEndsAt, refresh } = useAccess();
  const [busy, setBusy] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  // Raison pour laquelle les prix du store manquent, le cas échéant.
  const [probleme, setProbleme] = useState<string | null>(null);

  useEffect(() => {
    getPlans().then(({ plans: offres, probleme: souci }) => {
      setPlans(offres);
      setProbleme(souci ?? null);
    });
  }, []);

  // Traduit une issue d'achat en message. L'annulation ne dit rien : c'est un
  // choix de l'utilisateur, pas une anomalie.
  const signaler = (resultat: ResultatAchat) => {
    switch (resultat.statut) {
      case 'succes':
      case 'annule':
        return;
      case 'aucun':
        Alert.alert(t('paywall.restoreNone'));
        return;
      case 'non_configure':
        Alert.alert(t('paywall.title'), t('paywall.comingSoon'));
        return;
      case 'indisponible':
        Alert.alert(t('paywall.unavailableTitle'), `${t('paywall.unavailableBody')}\n\n${resultat.detail}`);
        return;
      case 'erreur':
        Alert.alert(
          t('paywall.errorTitle'),
          resultat.code ? `${resultat.message}\n\n(${resultat.code})` : resultat.message,
        );
    }
  };

  const trialOver = trialEndsAt ? Date.now() >= trialEndsAt.getTime() : false;

  // Prix réels du store si disponibles, sinon libellés statiques de secours.
  const yearlyPrice = plans.find((p) => p.period === 'yearly')?.priceLabel;
  const monthlyPrice = plans.find((p) => p.period === 'monthly')?.priceLabel;
  const yearlyLabel = yearlyPrice ? `${t('paywall.yearlyWord')} — ${yearlyPrice}` : t('paywall.yearly');
  const monthlyLabel = monthlyPrice
    ? `${t('paywall.monthlyWord')} — ${monthlyPrice}`
    : t('paywall.monthly');

  const subscribe = async (planId: 'monthly' | 'yearly') => {
    setBusy(true);
    const resultat = await purchasePlan(planId);
    setBusy(false);
    if (resultat.statut === 'succes') await refresh();
    signaler(resultat);
  };

  const restore = async () => {
    setBusy(true);
    const resultat = await restorePurchases();
    setBusy(false);
    if (resultat.statut === 'succes') await refresh();
    signaler(resultat);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText style={styles.emoji}>🌙</ThemedText>
          <ThemedText type="title" style={styles.title}>
            {t('paywall.title')}
          </ThemedText>
          <ThemedText style={styles.paragraph}>
            {trialOver ? t('paywall.trialOver') : t('paywall.intro')}
          </ThemedText>

          {/* Connexion : nécessaire pour démarrer l'essai ou retrouver l'abonnement. */}
          {!user ? (
            <Pressable
              onPress={() => router.push('/settings')}
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}>
              <ThemedText style={styles.primaryLabel}>{t('paywall.signInToStart')}</ThemedText>
            </Pressable>
          ) : (
            <>
              <Pressable
                disabled={busy}
                onPress={() => subscribe('yearly')}
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}>
                <ThemedText style={styles.primaryLabel}>{yearlyLabel}</ThemedText>
                <ThemedText type="small" style={styles.primarySub}>
                  {t('paywall.yearlyHint')}
                </ThemedText>
              </Pressable>
              <Pressable
                disabled={busy}
                onPress={() => subscribe('monthly')}
                style={({ pressed }) => [styles.outlineBtn, pressed && styles.pressed]}>
                <ThemedText type="smallBold" style={styles.outlineLabel}>
                  {monthlyLabel}
                </ThemedText>
              </Pressable>
              <Pressable onPress={restore} hitSlop={Spacing.two} style={styles.textBtn}>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('paywall.restore')}
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => router.push('/settings')}
                hitSlop={Spacing.two}
                style={styles.textBtn}>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('paywall.account')}
                </ThemedText>
              </Pressable>
            </>
          )}

          {/* Bandeau de diagnostic : n'apparaît QUE si les prix du store n'ont
              pas pu être chargés. Dans une configuration correcte il reste
              invisible ; s'il s'affiche, le paywall est de toute façon
              inutilisable et connaître la cause vaut mieux que l'ignorer. */}
          {probleme ? (
            <View style={styles.diagBox}>
              <ThemedText type="smallBold" style={styles.diagTitle}>
                {t('paywall.pricesUnavailable')}
              </ThemedText>
              <ThemedText type="small" style={styles.diagDetail}>
                {probleme}
              </ThemedText>
            </View>
          ) : null}

          <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
            {busy ? t('paywall.working') : t('paywall.note')}
          </ThemedText>

          {/* Liens légaux exigés par Apple pour un abonnement (règle 3.1.2). */}
          <View style={styles.legalRow}>
            <Pressable onPress={() => Linking.openURL(TERMS_URL).catch(() => {})} hitSlop={Spacing.two}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.legalLink}>
                {t('paywall.terms')}
              </ThemedText>
            </Pressable>
            <ThemedText type="small" themeColor="textSecondary">
              ·
            </ThemedText>
            <Pressable
              onPress={() => Linking.openURL(PRIVACY_URL).catch(() => {})}
              hitSlop={Spacing.two}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.legalLink}>
                {t('paywall.privacy')}
              </ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four },
  content: { flexGrow: 1, justifyContent: 'center', paddingVertical: Spacing.six, gap: Spacing.three },
  emoji: { fontSize: 52, textAlign: 'center' },
  title: { fontSize: 32, lineHeight: 40, textAlign: 'center' },
  paragraph: { fontSize: 16, lineHeight: 26, color: CREAM, textAlign: 'center' },
  primaryBtn: {
    backgroundColor: CREAM,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  primaryLabel: { color: GREEN, fontSize: 16, fontWeight: '700' },
  primarySub: { color: GREEN, opacity: 0.75, marginTop: 2 },
  outlineBtn: {
    borderWidth: 1,
    borderColor: 'rgba(245, 238, 218, 0.35)',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  outlineLabel: { color: CREAM },
  textBtn: { alignItems: 'center', marginTop: Spacing.one },
  note: { textAlign: 'center', marginTop: Spacing.two, lineHeight: 20 },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  legalLink: { textDecorationLine: 'underline' },
  diagBox: {
    borderWidth: 1,
    borderColor: 'rgba(229, 72, 77, 0.45)',
    backgroundColor: 'rgba(229, 72, 77, 0.10)',
    borderRadius: 12,
    padding: Spacing.three,
    gap: 4,
  },
  diagTitle: { color: '#F5EEDA' },
  diagDetail: { color: 'rgba(245, 238, 218, 0.75)', lineHeight: 18 },
  pressed: { opacity: 0.8 },
});
