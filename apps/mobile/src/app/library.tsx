import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookCard } from '@/components/book-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Book } from '@/domain/book';
import { useBook, useBooks } from '@/hooks/use-content';
import { useLastRead, type LastRead } from '@/hooks/use-last-read';
import { useReadingProgress } from '@/hooks/use-reading-progress';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

// Normalise pour une recherche insensible à la casse ET aux accents :
// « priere » retrouve « Prière ». La décomposition NFD sépare chaque
// lettre de ses signes diacritiques combinants (points de code
// U+0300 à U+036F), qu'on retire ensuite.
const DIACRITIC_START = 0x0300;
const DIACRITIC_END = 0x036f;

function normalize(value: string) {
  let result = '';
  for (const char of value.normalize('NFD')) {
    const code = char.codePointAt(0) ?? 0;
    if (code < DIACRITIC_START || code > DIACRITIC_END) {
      result += char;
    }
  }
  return result.toLowerCase();
}

// Sentinelle interne « tout afficher » (valeur stable, libellé traduit à part).
const ALL_CATEGORIES = '__all__';

// Carte « Reprendre la lecture » : rouvre le dernier chapitre ouvert. Rendue
// uniquement quand il existe un dernier chapitre (donc pas de requête inutile).
function ContinueCard({ lastRead }: { lastRead: LastRead }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { getProgress } = useReadingProgress();
  const { book } = useBook(lastRead.bookId);
  const pct = Math.round(getProgress(lastRead.chapterId) * 100);
  const title = book?.title ? `${book.title} · ${lastRead.chapterTitle}` : lastRead.chapterTitle;

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/chapter/[id]', params: { id: lastRead.chapterId } })}
      accessibilityRole="button"
      accessibilityLabel={t('home.continue.a11y', { title })}
      style={({ pressed }) => [styles.continueCard, pressed && styles.pressed]}>
      <View style={styles.continueTextCol}>
        <ThemedText type="smallBold" style={styles.continueEyebrow}>
          {t('home.continue.eyebrow')}
        </ThemedText>
        <ThemedText style={styles.continueTitle} numberOfLines={2}>
          {title}
        </ThemedText>
        <ThemedText style={styles.continueMeta}>
          {t('chapter.meta', { order: lastRead.order, pct })}
        </ThemedText>
      </View>
      <ThemedText style={styles.continueChevron}>›</ThemedText>
    </Pressable>
  );
}

export default function LibraryScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { books, loading } = useBooks();
  const { lastRead } = useLastRead();
  const { hasProgress, resetAll } = useReadingProgress();
  // Catégorie passée en paramètre d'URL (ex. depuis le badge de l'écran détail).
  const { category: categoryParam } = useLocalSearchParams<{ category?: string }>();
  const [query, setQuery] = useState('');
  const [sortAscending, setSortAscending] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam ?? ALL_CATEGORIES);

  // Synchronise le filtre quand on arrive avec une catégorie en paramètre.
  useEffect(() => {
    if (categoryParam) setSelectedCategory(categoryParam);
  }, [categoryParam]);

  // Catégories dérivées des livres : le backend pourra en ajouter sans
  // toucher à cet écran. La sentinelle « toutes » en tête retire le filtre.
  const categories = useMemo(
    () => [ALL_CATEGORIES, ...Array.from(new Set(books.map((book) => book.category)))],
    [books],
  );

  const visibleBooks = useMemo(() => {
    const q = normalize(query.trim());
    const filtered = books.filter((book) => {
      const matchesCategory =
        selectedCategory === ALL_CATEGORIES || book.category === selectedCategory;
      const matchesQuery = !q || normalize(`${book.title} ${book.description}`).includes(q);
      return matchesCategory && matchesQuery;
    });

    // Tri alphabétique par titre, insensible aux accents (via normalize).
    const sorted = [...filtered].sort((a, b) => {
      const titleA = normalize(a.title);
      const titleB = normalize(b.title);
      if (titleA < titleB) return -1;
      if (titleA > titleB) return 1;
      return 0;
    });

    return sortAscending ? sorted : sorted.reverse();
  }, [books, query, sortAscending, selectedCategory]);

  const handleResetAll = () => {
    Alert.alert(t('library.resetAllTitle'), t('library.resetAllMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('library.resetAllConfirm'), style: 'destructive', onPress: resetAll },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            hitSlop={Spacing.two}
            accessibilityRole="button"
            accessibilityLabel={t('library.backHomeA11y')}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              ‹ {t('library.backHome')}
            </ThemedText>
          </Pressable>
          <Link href="/settings" asChild>
            <Pressable
              hitSlop={Spacing.two}
              accessibilityRole="button"
              accessibilityLabel={t('settings.a11y')}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                {t('settings.title')}
              </ThemedText>
            </Pressable>
          </Link>
        </View>
        <ThemedText type="title" style={styles.title}>
          {t('library.title')}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          {t('library.subtitle')}
        </ThemedText>

        {lastRead ? <ContinueCard lastRead={lastRead} /> : null}

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('library.searchPlaceholder')}
          placeholderTextColor={theme.textSecondary}
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
          accessibilityLabel={t('library.searchPlaceholder')}
          style={[styles.search, { backgroundColor: theme.backgroundElement, color: theme.text }]}
        />

        <View style={styles.categories}>
          {categories.map((category) => {
            const selected = category === selectedCategory;
            const label = category === ALL_CATEGORIES ? t('library.categoryAll') : category;
            return (
              <Pressable
                key={category}
                onPress={() => setSelectedCategory(category)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={label}
                style={({ pressed }) => [
                  styles.chip,
                  { backgroundColor: selected ? '#0C5A44' : theme.backgroundElement },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold" style={{ color: selected ? '#ffffff' : theme.text }}>
                  {label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={() => setSortAscending((value) => !value)}
          accessibilityRole="button"
          accessibilityLabel={sortAscending ? t('library.sortAsc') : t('library.sortDesc')}
          style={({ pressed }) => [
            styles.sortButton,
            { backgroundColor: theme.backgroundElement },
            pressed && styles.pressed,
          ]}>
          <ThemedText type="smallBold">
            {sortAscending ? t('library.sortAsc') : t('library.sortDesc')}
          </ThemedText>
        </Pressable>

        <FlatList
          data={visibleBooks}
          keyExtractor={(book: Book) => book.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Link href={{ pathname: '/book/[id]', params: { id: item.id } }} asChild>
              <Pressable style={({ pressed }) => (pressed ? styles.pressed : undefined)}>
                <BookCard book={item} />
              </Pressable>
            </Link>
          )}
          contentContainerStyle={styles.list}
          ListFooterComponent={
            hasProgress ? (
              <Pressable onPress={handleResetAll} hitSlop={Spacing.two} style={styles.resetAll}>
                <ThemedText type="link" themeColor="textSecondary">
                  {t('library.resetAll')}
                </ThemedText>
              </Pressable>
            ) : null
          }
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              {loading
                ? t('common.loading')
                : query.trim()
                  ? t('library.emptySearch', { query: query.trim() })
                  : t('library.emptyCategory')}
            </ThemedText>
          }
        />
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
  },
  subtitle: {
    marginTop: Spacing.one,
    marginBottom: Spacing.three,
  },
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(245, 238, 218, 0.22)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  continueTextCol: {
    flex: 1,
    gap: 3,
  },
  continueEyebrow: {
    color: '#E0BE6D',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  continueTitle: {
    color: '#F5EEDA',
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  },
  continueMeta: {
    color: 'rgba(245, 238, 218, 0.72)',
    fontSize: 13,
  },
  continueChevron: {
    color: 'rgba(245, 238, 218, 0.72)',
    fontSize: 28,
    lineHeight: 28,
  },
  search: {
    height: 44,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
    marginBottom: Spacing.three,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingBottom: Spacing.three,
  },
  chip: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
  },
  sortButton: {
    alignSelf: 'flex-end',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    marginBottom: Spacing.three,
  },
  list: {
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  pressed: {
    opacity: 0.6,
  },
  empty: {
    textAlign: 'center',
    marginTop: Spacing.five,
  },
  resetAll: {
    alignSelf: 'center',
    marginTop: Spacing.four,
  },
});
