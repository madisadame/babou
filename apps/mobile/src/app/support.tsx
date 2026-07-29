import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { fetchSiteContent } from '@/data/supabase/site-content';
import { useTranslation } from '@/hooks/use-translation';

const CREAM = '#F5EEDA';
const GREEN = '#0C5A44';

// Écran « Soutenir Babou » : don ponctuel + soutien récurrent (mensuel /
// annuel). Les liens de paiement sont configurés depuis l'admin (site_content)
// et ouverts en externe ; le montant se choisit sur la page de paiement.
export default function SupportScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [content, setContent] = useState<Record<string, string>>({});

  useFocusEffect(
    useCallback(() => {
      fetchSiteContent().then(setContent);
    }, []),
  );

  const open = (url?: string) => {
    if (url) Linking.openURL(url).catch(() => {});
  };

  const intro = content['support.intro'] || t('support.intro');
  const donate = content['support.donateUrl'];
  const monthly = content['support.monthlyUrl'];
  const yearly = content['support.yearlyUrl'];
  const anyLink = donate || monthly || yearly;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()} hitSlop={Spacing.three} style={styles.back}>
          <ThemedText type="link" themeColor="textSecondary">
            ← {t('common.back')}
          </ThemedText>
        </Pressable>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText style={styles.heart}>🤲</ThemedText>
          <ThemedText type="title" style={styles.title}>
            {t('support.title')}
          </ThemedText>
          <ThemedText style={styles.paragraph}>{intro}</ThemedText>

          {!anyLink ? (
            <ThemedText themeColor="textSecondary" style={styles.soon}>
              {t('support.soon')}
            </ThemedText>
          ) : (
            <>
              {donate ? (
                <Pressable
                  onPress={() => open(donate)}
                  style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}>
                  <ThemedText style={styles.primaryLabel}>{t('support.donateOnce')}</ThemedText>
                </Pressable>
              ) : null}
              {monthly ? (
                <Pressable
                  onPress={() => open(monthly)}
                  style={({ pressed }) => [styles.outlineBtn, pressed && styles.pressed]}>
                  <ThemedText type="smallBold" style={styles.outlineLabel}>
                    {t('support.monthly')}
                  </ThemedText>
                </Pressable>
              ) : null}
              {yearly ? (
                <Pressable
                  onPress={() => open(yearly)}
                  style={({ pressed }) => [styles.outlineBtn, pressed && styles.pressed]}>
                  <ThemedText type="smallBold" style={styles.outlineLabel}>
                    {t('support.yearly')}
                  </ThemedText>
                </Pressable>
              ) : null}
            </>
          )}

          <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
            {t('support.note')}
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.four },
  back: { marginBottom: Spacing.three },
  content: { paddingBottom: Spacing.six, gap: Spacing.three },
  heart: { fontSize: 46, textAlign: 'center' },
  title: { fontSize: 32, lineHeight: 40, textAlign: 'center' },
  paragraph: { fontSize: 16, lineHeight: 26, color: CREAM, textAlign: 'center' },
  soon: { textAlign: 'center', marginTop: Spacing.two },
  primaryBtn: {
    backgroundColor: CREAM,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  primaryLabel: { color: GREEN, fontSize: 16, fontWeight: '700' },
  outlineBtn: {
    borderWidth: 1,
    borderColor: 'rgba(245, 238, 218, 0.35)',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  outlineLabel: { color: CREAM },
  note: { textAlign: 'center', marginTop: Spacing.two, lineHeight: 20 },
  pressed: { opacity: 0.8 },
});
