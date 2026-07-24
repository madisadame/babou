import { StyleSheet, View } from 'react-native';

import { ProgressBar } from '@/components/progress-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Chapter } from '@/domain/chapter';
import { useReadingProgress } from '@/hooks/use-reading-progress';

type ChapterRowProps = {
  chapter: Chapter;
};

// Ligne d'un chapitre dans la fiche d'un livre. Présentationnel : la
// navigation est gérée par le parent (Link + Pressable).
export function ChapterRow({ chapter }: ChapterRowProps) {
  const { getProgress } = useReadingProgress();
  const progress = getProgress(chapter.id);

  return (
    <ThemedView type="backgroundElement" style={styles.row}>
      <View style={styles.info}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          Chapitre {chapter.order}
        </ThemedText>
        <ThemedText style={styles.title}>{chapter.title}</ThemedText>
        <ThemedText themeColor="textSecondary" numberOfLines={2}>
          {chapter.description}
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

      <ThemedText type="subtitle" themeColor="textSecondary" style={styles.chevron}>
        ›
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Spacing.three,
    padding: Spacing.four,
  },
  info: {
    flex: 1,
    gap: Spacing.one,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
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
  chevron: {
    fontSize: 24,
  },
});
