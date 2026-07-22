import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookCard } from '@/components/book-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { mockBooks } from '@/data/mock-books';
import type { Book } from '@/types/book';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Babou
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          Choisis un livre pour commencer à apprendre.
        </ThemedText>

        <FlatList
          data={mockBooks}
          keyExtractor={(book: Book) => book.id}
          renderItem={({ item }) => <BookCard book={item} />}
          contentContainerStyle={styles.list}
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
    marginBottom: Spacing.four,
  },
  list: {
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
});
