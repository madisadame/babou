import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookCard } from '@/components/book-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { mockBooks } from '@/data/mock-books';
import { useReadingProgress } from '@/hooks/use-reading-progress';
import { useTheme } from '@/hooks/use-theme';
import type { Book } from '@/types/book';

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

// Onglet « tout afficher » du filtre par catégorie.
const ALL_CATEGORIES = 'Toutes';

export default function LibraryScreen() {
  const theme = useTheme();
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

  // Catégories dérivées des données : le backend pourra en ajouter sans
  // toucher à cet écran. « Toutes » en tête pour retirer le filtre.
  const categories = useMemo(
    () => [ALL_CATEGORIES, ...Array.from(new Set(mockBooks.map((book) => book.category)))],
    [],
  );

  const visibleBooks = useMemo(() => {
    const q = normalize(query.trim());
    const filtered = mockBooks.filter((book) => {
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
  }, [query, sortAscending, selectedCategory]);

  const handleResetAll = () => {
    Alert.alert(
      'Réinitialiser toute la progression',
      'La progression de lecture de tous les livres sera effacée. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Tout réinitialiser', style: 'destructive', onPress: resetAll },
      ],
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Bibliothèque
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          Choisis un livre pour commencer à apprendre.
        </ThemedText>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher un livre…"
          placeholderTextColor={theme.textSecondary}
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="while-editing"
          accessibilityLabel="Rechercher un livre"
          style={[styles.search, { backgroundColor: theme.backgroundElement, color: theme.text }]}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categories}>
          {categories.map((category) => {
            const selected = category === selectedCategory;
            return (
              <Pressable
                key={category}
                onPress={() => setSelectedCategory(category)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`Filtrer par ${category}`}
                style={({ pressed }) => [
                  styles.chip,
                  { backgroundColor: selected ? '#3c87f7' : theme.backgroundElement },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold" style={selected ? styles.chipTextSelected : undefined}>
                  {category}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable
          onPress={() => setSortAscending((value) => !value)}
          accessibilityRole="button"
          accessibilityLabel={
            sortAscending
              ? 'Trier les livres par titre, ordre décroissant'
              : 'Trier les livres par titre, ordre croissant'
          }
          style={({ pressed }) => [
            styles.sortButton,
            { backgroundColor: theme.backgroundElement },
            pressed && styles.pressed,
          ]}>
          <ThemedText type="smallBold">Titre {sortAscending ? 'A → Z' : 'Z → A'}</ThemedText>
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
                  Réinitialiser toute la progression
                </ThemedText>
              </Pressable>
            ) : null
          }
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              {query.trim()
                ? `Aucun livre ne correspond à « ${query.trim()} ».`
                : 'Aucun livre dans cette catégorie.'}
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
  title: {
    fontSize: 34,
    lineHeight: 40,
  },
  subtitle: {
    marginTop: Spacing.one,
    marginBottom: Spacing.three,
  },
  search: {
    height: 44,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
    marginBottom: Spacing.three,
  },
  categoriesScroll: {
    flexGrow: 0,
  },
  categories: {
    gap: Spacing.two,
    paddingBottom: Spacing.three,
  },
  chip: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
  },
  chipTextSelected: {
    color: '#ffffff',
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
