import { Image } from 'expo-image';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChapterRow } from '@/components/chapter-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Chapter } from '@/domain/chapter';
import { useBook, useChapters } from '@/hooks/use-content';
import { useDownloads } from '@/hooks/use-downloads';
import { useTranslation } from '@/hooks/use-translation';

// Fiche d'un livre : entête (couverture, catégorie, titre, description) puis
// la liste de ses chapitres. Chaque chapitre mène à son écran de lecture.
export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const [isCoverOpen, setIsCoverOpen] = useState(false);

  const { book, loading: loadingBook } = useBook(id);
  const { chapters, loading: loadingChapters } = useChapters(id);
  const { entryFor, download, remove } = useDownloads();
  const offline = entryFor(id);

  const confirmRemove = () => {
    Alert.alert(t('offline.removeTitle'), t('offline.removeMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('offline.removeConfirm'), style: 'destructive', onPress: () => remove(id) },
    ]);
  };

  const header = book ? (
    <ThemedView style={styles.header}>
      {book.coverUrl ? (
        <Pressable
          onPress={() => setIsCoverOpen(true)}
          accessibilityRole="imagebutton"
          accessibilityLabel={t('book.coverOpenA11y')}
          style={({ pressed }) => (pressed ? styles.coverPressed : undefined)}>
          <Image
            source={{ uri: book.coverUrl }}
            style={styles.cover}
            contentFit="cover"
            transition={200}
            accessibilityIgnoresInvertColors
          />
        </Pressable>
      ) : null}

      <Pressable
        onPress={() =>
          router.navigate({ pathname: '/library', params: { category: book.category } })
        }
        accessibilityRole="button"
        accessibilityLabel={t('book.categoryA11y', { category: book.category })}
        style={({ pressed }) => [styles.categoryButton, pressed && styles.categoryPressed]}>
        <ThemedView type="backgroundElement" style={styles.categoryBadge}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            {book.category} ›
          </ThemedText>
        </ThemedView>
      </Pressable>

      <ThemedText type="title" style={styles.title}>
        {book.title}
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.description}>
        {book.description}
      </ThemedText>

      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.chaptersLabel}>
        {t(book.chapterCount > 1 ? 'book.chapterLabelOther' : 'book.chapterLabelOne', {
          count: book.chapterCount,
        })}
      </ThemedText>

      <View style={styles.offlineRow}>
        {offline.status === 'done' ? (
          <>
            <ThemedText type="smallBold" style={styles.offlineDone}>
              ✓ {t('offline.done')}
            </ThemedText>
            <Pressable onPress={confirmRemove} hitSlop={Spacing.two} accessibilityRole="button">
              <ThemedText type="smallBold" style={styles.offlineRemove}>
                {t('offline.remove')}
              </ThemedText>
            </Pressable>
          </>
        ) : offline.status === 'downloading' ? (
          <ThemedView type="backgroundElement" style={styles.offlineBtn}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              {t('offline.downloading', { pct: Math.round(offline.progress * 100) })}
            </ThemedText>
          </ThemedView>
        ) : (
          <Pressable
            onPress={() => download(id)}
            accessibilityRole="button"
            style={({ pressed }) => (pressed ? styles.pressed : undefined)}>
            <ThemedView type="backgroundElement" style={styles.offlineBtn}>
              <ThemedText type="smallBold">
                ⤓ {offline.status === 'error' ? t('offline.error') : t('offline.download')}
              </ThemedText>
            </ThemedView>
          </Pressable>
        )}
      </View>
    </ThemedView>
  ) : null;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()} hitSlop={Spacing.three} style={styles.back}>
          <ThemedText type="link" themeColor="textSecondary">
            ← {t('common.back')}
          </ThemedText>
        </Pressable>

        {loadingBook ? (
          <ThemedText themeColor="textSecondary" style={styles.centered}>
            {t('common.loading')}
          </ThemedText>
        ) : book ? (
          <FlatList
            data={chapters}
            keyExtractor={(chapter: Chapter) => chapter.id}
            ListHeaderComponent={header}
            renderItem={({ item }) => (
              <Link href={{ pathname: '/chapter/[id]', params: { id: item.id } }} asChild>
                <Pressable style={({ pressed }) => (pressed ? styles.pressed : undefined)}>
                  <ChapterRow chapter={item} />
                </Pressable>
              </Link>
            )}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <ThemedText themeColor="textSecondary" style={styles.centered}>
                {loadingChapters ? t('common.loading') : t('book.chaptersEmpty')}
              </ThemedText>
            }
          />
        ) : (
          <ThemedView style={styles.notFound}>
            <ThemedText type="subtitle">{t('book.notFoundTitle')}</ThemedText>
            <ThemedText themeColor="textSecondary">{t('book.notFoundMessage')}</ThemedText>
          </ThemedView>
        )}

        <Modal
          visible={isCoverOpen}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setIsCoverOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setIsCoverOpen(false)}>
            {book?.coverUrl ? (
              <Image
                source={{ uri: book.coverUrl }}
                style={styles.fullCover}
                contentFit="contain"
                transition={150}
                accessibilityIgnoresInvertColors
              />
            ) : null}
            <ThemedText type="small" style={styles.hint}>
              {t('book.coverClose')}
            </ThemedText>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  back: {
    marginBottom: Spacing.three,
  },
  list: {
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  header: {
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  cover: {
    width: 180,
    height: 240,
    borderRadius: Spacing.three,
    alignSelf: 'center',
  },
  coverPressed: {
    opacity: 0.85,
  },
  categoryButton: {
    alignSelf: 'flex-start',
  },
  categoryPressed: {
    opacity: 0.6,
  },
  categoryBadge: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  chaptersLabel: {
    marginTop: Spacing.two,
    letterSpacing: 1,
  },
  offlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  offlineBtn: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
  },
  offlineDone: {
    color: '#7fd3af',
  },
  offlineRemove: {
    color: '#e5484d',
  },
  pressed: {
    opacity: 0.6,
  },
  centered: {
    textAlign: 'center',
    marginTop: Spacing.five,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.two,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.four,
  },
  fullCover: {
    width: '100%',
    height: '75%',
  },
  hint: {
    color: '#ffffff',
    opacity: 0.7,
  },
});
