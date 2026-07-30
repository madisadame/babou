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
  purchasesConfigured,
  restorePurchases,
  type SubscriptionPlan,
} from '@/data/purchases';
import { useAccess } from '@/hooks/use-access';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from '@/hooks/use-translation';

const CREAM = '#F5EEDA';
const GREEN = '#0C5A44';

// Liens légaux requis par Apple (règle 3.1.2) pour un abonnement.
// Mets à jour PRIVACY_URL avec l'URL définitive de la politique une fois hébergée.
const PRIVACY_URL =
  'https://xjmjdwxmszfqnhdtnnru.supabase.co/storage/v1/object/public/legal/confidentialite.html';
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

  useEffect(() => {
    getPlans().then(setPlans);
  }, []);

  const trialOver = trialEndsAt ? Date.now() >= trialEndsAt.getTime() : false;

  // Prix réels du store si disponibles, sinon libellés statiques de secours.
  const yearlyPrice = plans.find((p) => p.period === 'yearly')?.priceLabel;
  const monthlyPrice = plans.find((p) => p.period === 'monthly')?.priceLabel;
  const yearlyLabel = yearlyPrice ? `${t('paywall.yearlyWord')} — ${yearlyPrice}` : t('paywall.yearly');
  const monthlyLabel = monthlyPrice
    ? `${t('paywall.monthlyWord')} — ${monthlyPrice}`
    : t('paywall.monthly');

  const subscribe = async (planId: 'monthly' | 'yearly') => {
    if (!purchasesConfigured) {
      Alert.alert(t('paywall.title'), t('paywall.comingSoon'));
      return;
    }
    setBusy(true);
    const ok = await purchasePlan(planId);
    setBusy(false);
    if (ok) await refresh();
  };

  const restore = async () => {
    if (!purchasesConfigured) {
      Alert.alert(t('paywall.title'), t('paywall.comingSoon'));
      return;
    }
    setBusy(true);
    const ok = await restorePurchases();
    setBusy(false);
    await refresh();
    if (!ok) Alert.alert(t('paywall.restoreNone'));
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

          <Pressable
            onPress={() => router.push('/support')}
            hitSlop={Spacing.two}
            style={styles.textBtn}>
            <ThemedText type="small" style={styles.supportLink}>
              {t('paywall.donateInstead')}
            </ThemedText>
          </Pressable>

          <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
            {t('paywall.note')}
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
  supportLink: { color: '#E0BE6D' },
  note: { textAlign: 'center', marginTop: Spacing.two, lineHeight: 20 },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  legalLink: { textDecorationLine: 'underline' },
  pressed: { opacity: 0.8 },
});
