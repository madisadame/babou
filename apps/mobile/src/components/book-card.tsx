import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ProgressBar } from '@/components/progress-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useReadingProgress } from '@/hooks/use-reading-progress';
import type { Book } from '@/types/book';

type BookCardProps = {
  book: Book;
};

// Carte réutilisable : ne dépend que de la forme des données (Book),
// pas de leur origine (fictives aujourd'hui, backend demain).
export function BookCard({ book }: BookCardProps) {
  const { getProgress } = useReadingProgress();
  const progress = getProgress(book.id);

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      {book.coverUrl ? (
        <Image
          source={{ uri: book.coverUrl }}
          style={styles.cover}
          contentFit="cover"
          transition={200}
          accessibilityIgnoresInvertColors
        />
      ) : (
        // Repli quand un livre n'a pas de couverture.
        <ThemedView type="backgroundSelected" style={styles.cover} />
      )}

      <View style={styles.info}>
        <ThemedText type="subtitle" style={styles.title}>
          {book.title}
        </ThemedText>
        <ThemedText themeColor="textSecondary" numberOfLines={2}>
          {book.description}
        </ThemedText>

        {progress > 0 ? (
          <View style={styles.progressRow}>
            <View style={styles.progressBar}>
              <ProgressBar value={progress} />
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {Math.round(progress * 100)} %
            </ThemedText>
          </View>
        ) : null}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  cover: {
    width: 56,
    height: 76,
    borderRadius: Spacing.two,
  },
  info: {
    flex: 1,
    gap: Spacing.one,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  progressBar: {
    flex: 1,
  },
});
