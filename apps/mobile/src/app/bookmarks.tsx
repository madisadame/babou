import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useBookmarks, type Bookmark } from '@/hooks/use-bookmarks';
import { useTranslation } from '@/hooks/use-translation';

// Liste des marque-pages : chapitres mis de côté. Toucher ouvre le chapitre ;
// l'étoile le retire.
export default function BookmarksScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { bookmarks, remove } = useBookmarks();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()} hitSlop={Spacing.three} style={styles.back}>
          <ThemedText type="link" themeColor="textSecondary">
            ← {t('common.back')}
          </ThemedText>
        </Pressable>
        <ThemedText type="title" style={styles.title}>
          {t('bookmark.title')}
        </ThemedText>

        {bookmarks.length === 0 ? (
          <ThemedText themeColor="textSecondary" style={styles.empty}>
            {t('bookmark.empty')}
          </ThemedText>
        ) : (
          <FlatList
            data={bookmarks}
            keyExtractor={(b: Bookmark) => b.chapterId}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <ThemedView type="backgroundElement" style={styles.row}>
                <Pressable
                  style={({ pressed }) => [styles.rowMain, pressed && styles.pressed]}
                  onPress={() =>
                    router.push({ pathname: '/chapter/[id]', params: { id: item.chapterId } })
                  }>
                  <ThemedText style={styles.rowTitle} numberOfLines={2}>
                    {item.chapterTitle}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {t('chapter.label', { order: item.order })}
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => remove(item.chapterId)}
                  hitSlop={Spacing.two}
                  accessibilityRole="button"
                  accessibilityLabel={t('bookmark.remove')}>
                  <ThemedText style={styles.star}>★</ThemedText>
                </Pressable>
              </ThemedView>
            )}
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
  title: { fontSize: 34, lineHeight: 40, marginBottom: Spacing.three },
  empty: { textAlign: 'center', marginTop: Spacing.five },
  list: { gap: Spacing.two, paddingBottom: Spacing.six },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  rowMain: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 16, fontWeight: '600' },
  star: { fontSize: 22, color: '#E0BE6D' },
  pressed: { opacity: 0.6 },
});
