import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookCard } from '@/components/book-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { mockBooks } from '@/data/mock-books';
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

export default function HomeScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [sortAscending, setSortAscending] = useState(true);

  const visibleBooks = useMemo(() => {
    const q = normalize(query.trim());
    const filtered = q
      ? mockBooks.filter((book) => normalize(`${book.title} ${book.description}`).includes(q))
      : mockBooks;

    // Tri alphabétique par titre, insensible aux accents (via normalize).
    const sorted = [...filtered].sort((a, b) => {
      const titleA = normalize(a.title);
      const titleB = normalize(b.title);
      if (titleA < titleB) return -1;
      if (titleA > titleB) return 1;
      return 0;
    });

    return sortAscending ? sorted : sorted.reverse();
  }, [query, sortAscending]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Babou
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
          ListEmptyComponent={
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              Aucun livre ne correspond à « {query.trim()} ».
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
});
