import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Book } from '@/domain/book';
import { useTranslation } from '@/hooks/use-translation';

type BookCardProps = {
  book: Book;
};

// Carte d'un livre dans la bibliothèque. Ne dépend que du type Book,
// pas de l'origine des données (mock aujourd'hui, backend demain).
export function BookCard({ book }: BookCardProps) {
  const { t } = useTranslation();

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
        <ThemedText type="small" themeColor="textSecondary">
          {t(book.chapterCount > 1 ? 'book.chapterCountOther' : 'book.chapterCountOne', {
            count: book.chapterCount,
          })}
        </ThemedText>
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
});
