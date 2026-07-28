import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProgressBar } from '@/components/progress-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { getContentStats, type ContentStat } from '@/data/supabase/admin-repository';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from '@/hooks/use-translation';

// Statistiques de contenu : progression des lecteurs par chapitre (agrégée
// via une fonction SQL réservée aux admins).
export default function AdminStatsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState<ContentStat[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getContentStats().then((data) => {
        setStats(data);
        setLoading(false);
      });
    }, []),
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()} hitSlop={Spacing.three} style={styles.back}>
          <ThemedText type="link" themeColor="textSecondary">
            ← {t('common.back')}
          </ThemedText>
        </Pressable>

        {!isAdmin ? (
          <ThemedText themeColor="textSecondary" style={styles.centered}>
            {t('admin.denied')}
          </ThemedText>
        ) : (
          <FlatList
            data={stats}
            keyExtractor={(s) => s.chapterId}
            ListHeaderComponent={
              <View style={styles.header}>
                <ThemedText type="title" style={styles.title}>
                  {t('admin.statsTitle')}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('admin.statsHint')}
                </ThemedText>
              </View>
            }
            renderItem={({ item }) => (
              <ThemedView type="backgroundElement" style={styles.row}>
                <ThemedText type="small" themeColor="textSecondary">
                  {item.bookTitle}
                </ThemedText>
                <ThemedText type="smallBold">{item.chapterTitle}</ThemedText>
                <ProgressBar value={item.avgProgress} />
                <ThemedText type="small" themeColor="textSecondary">
                  {t('admin.statsLine', {
                    readers: item.readers,
                    completed: item.completed,
                    pct: Math.round(item.avgProgress * 100),
                  })}
                </ThemedText>
              </ThemedView>
            )}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <ThemedText themeColor="textSecondary" style={styles.centered}>
                {loading ? t('common.loading') : t('admin.statsEmpty')}
              </ThemedText>
            }
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.four },
  back: { marginBottom: Spacing.three },
  header: { gap: Spacing.two, marginBottom: Spacing.three },
  title: { fontSize: 30, lineHeight: 36 },
  list: { gap: Spacing.two, paddingBottom: Spacing.six },
  row: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  centered: { textAlign: 'center', marginTop: Spacing.five },
});
