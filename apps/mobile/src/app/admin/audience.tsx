import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BarChart, type BarDatum } from '@/components/bar-chart';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { fetchUserStats, type UserStats } from '@/data/supabase/access';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from '@/hooks/use-translation';

const MONTHS_FR = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'aoû', 'sep', 'oct', 'nov', 'déc'];

// 'YYYY-MM' -> 'juil. 25'
function monthLabel(ym: string): string {
  const [y, m] = ym.split('-');
  const idx = Number(m) - 1;
  return `${MONTHS_FR[idx] ?? m}. ${y.slice(2)}`;
}

export default function AdminAudienceScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchUserStats().then((data) => {
        setStats(data);
        setLoading(false);
      });
    }, []),
  );

  const chartData: BarDatum[] = (stats?.monthly ?? []).map((m) => ({
    label: monthLabel(m.month),
    value: m.count,
  }));

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText type="link" themeColor="textSecondary" onPress={() => router.back()}>
            ← {t('common.back')}
          </ThemedText>

          <ThemedText type="title" style={styles.title}>
            {t('admin.audienceTitle')}
          </ThemedText>

          {!isAdmin ? (
            <ThemedText themeColor="textSecondary">{t('admin.denied')}</ThemedText>
          ) : loading ? (
            <ThemedText themeColor="textSecondary">{t('common.loading')}</ThemedText>
          ) : !stats ? (
            <ThemedText themeColor="textSecondary">{t('admin.statsEmpty')}</ThemedText>
          ) : (
            <>
              <View style={styles.cards}>
                <ThemedView type="backgroundElement" style={styles.card}>
                  <ThemedText type="title" style={styles.cardNumber}>
                    {stats.totalUsers}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {t('admin.audTotalUsers')}
                  </ThemedText>
                </ThemedView>
                <ThemedView type="backgroundElement" style={styles.card}>
                  <ThemedText type="title" style={styles.cardNumber}>
                    {stats.newThisMonth}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {t('admin.audNewThisMonth')}
                  </ThemedText>
                </ThemedView>
                <ThemedView type="backgroundElement" style={styles.card}>
                  <ThemedText type="title" style={styles.cardNumber}>
                    {stats.grantedAccess}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {t('admin.audGrantedAccess')}
                  </ThemedText>
                </ThemedView>
              </View>

              <ThemedText type="smallBold" style={styles.sectionLabel}>
                {t('admin.audMonthlySignups')}
              </ThemedText>
              {chartData.length ? (
                <BarChart data={chartData} />
              ) : (
                <ThemedText type="small" themeColor="textSecondary">
                  {t('admin.statsEmpty')}
                </ThemedText>
              )}

              <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
                {t('admin.audSubscribersNote')}
              </ThemedText>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.four },
  content: { paddingBottom: Spacing.six, gap: Spacing.three },
  title: { fontSize: 30, lineHeight: 36 },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  card: {
    flexGrow: 1,
    flexBasis: 100,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: 2,
  },
  cardNumber: { fontSize: 30, lineHeight: 36 },
  sectionLabel: { marginTop: Spacing.two },
  note: {
    marginTop: Spacing.three,
    lineHeight: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#E0BE6D',
    paddingLeft: Spacing.three,
  },
});
