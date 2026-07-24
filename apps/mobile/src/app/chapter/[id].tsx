import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useChapter } from '@/hooks/use-content';
import { useReadingProgress } from '@/hooks/use-reading-progress';
import { useTranslation } from '@/hooks/use-translation';

// Lecture d'un chapitre. Le contenu réel (texte arabe + traduction + audio +
// vidéo) viendra du lecteur pédagogique (étape 4) et du backend (étape 7) ; en
// attendant, texte d'exemple neutre. La progression est calculée au défilement.
export default function ChapterReadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { chapter, loading } = useChapter(id);
  const { getProgress, setProgress, resetProgress } = useReadingProgress();

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!chapter) return;
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollable = contentSize.height - layoutMeasurement.height;
    // Si tout tient à l'écran, le chapitre est considéré comme lu.
    const fraction = scrollable <= 0 ? 1 : contentOffset.y / scrollable;
    setProgress(chapter.id, fraction);
  };

  const handleResetProgress = () => {
    if (!chapter) return;
    Alert.alert(t('chapter.resetTitle'), t('chapter.resetMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('chapter.resetConfirm'), style: 'destructive', onPress: () => resetProgress(chapter.id) },
    ]);
  };

  const progress = chapter ? getProgress(chapter.id) : 0;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()} hitSlop={Spacing.three} style={styles.back}>
          <ThemedText type="link" themeColor="textSecondary">
            ← {t('common.back')}
          </ThemedText>
        </Pressable>

        {loading ? (
          <ThemedText themeColor="textSecondary" style={styles.centered}>
            {t('common.loading')}
          </ThemedText>
        ) : chapter ? (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={50}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              {t('chapter.meta', { order: chapter.order, pct: Math.round(progress * 100) })}
            </ThemedText>
            <ThemedText type="title" style={styles.title}>
              {chapter.title}
            </ThemedText>

            <ThemedText style={styles.lead}>{chapter.description}</ThemedText>

            <ThemedText style={styles.paragraph}>{t('chapter.sampleP1')}</ThemedText>
            <ThemedText style={styles.paragraph}>{t('chapter.sampleP2')}</ThemedText>
            <ThemedText style={styles.paragraph}>{t('chapter.sampleP3')}</ThemedText>
            <ThemedText style={styles.paragraph}>{t('chapter.sampleP4')}</ThemedText>

            <ThemedView type="backgroundElement" style={styles.notice}>
              <ThemedText type="smallBold">{t('chapter.sampleNoticeTitle')}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {t('chapter.sampleNoticeBody')}
              </ThemedText>
            </ThemedView>

            {progress > 0 ? (
              <Pressable
                onPress={handleResetProgress}
                hitSlop={Spacing.two}
                style={styles.resetButton}>
                <ThemedText type="link" themeColor="textSecondary">
                  {t('chapter.reset')}
                </ThemedText>
              </Pressable>
            ) : null}
          </ScrollView>
        ) : (
          <ThemedView style={styles.notFound}>
            <ThemedText type="subtitle">{t('chapter.notFoundTitle')}</ThemedText>
            <ThemedText themeColor="textSecondary">{t('chapter.notFoundMessage')}</ThemedText>
          </ThemedView>
        )}
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
  content: {
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
  },
  lead: {
    fontSize: 18,
    lineHeight: 28,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 26,
  },
  notice: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  resetButton: {
    alignSelf: 'center',
    marginTop: Spacing.two,
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
});
