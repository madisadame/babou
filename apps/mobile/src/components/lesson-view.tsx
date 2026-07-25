import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { LessonSegment } from '@/domain/lesson';
import { useTranslation } from '@/hooks/use-translation';

type LessonViewProps = {
  segments: LessonSegment[];
};

// Rend une leçon : pour chaque segment, le texte arabe (droite-à-gauche) puis
// sa traduction dans la langue courante (repli français si absente).
export function LessonView({ segments }: LessonViewProps) {
  const { locale } = useTranslation();

  return (
    <View style={styles.container}>
      {segments.map((segment) => {
        const translation = segment.translations[locale] ?? segment.translations.fr;
        return (
          <View key={segment.id} style={styles.segment}>
            <ThemedText style={styles.arabic}>{segment.arabic}</ThemedText>
            {translation ? (
              <ThemedText themeColor="textSecondary" style={styles.translation}>
                {translation}
              </ThemedText>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  segment: {
    gap: 8,
  },
  arabic: {
    fontSize: 26,
    lineHeight: 46,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  translation: {
    fontSize: 16,
    lineHeight: 24,
  },
});
