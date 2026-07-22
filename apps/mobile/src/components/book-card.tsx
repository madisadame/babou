import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Book } from '@/types/book';

type BookCardProps = {
  book: Book;
};

// Carte réutilisable : ne dépend que de la forme des données (Book),
// pas de leur origine (fictives aujourd'hui, backend demain).
export function BookCard({ book }: BookCardProps) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="subtitle" style={styles.title}>
        {book.title}
      </ThemedText>
      <ThemedText themeColor="textSecondary">{book.description}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
  },
});
