import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AudioPlayer } from '@/components/audio-player';
import { LessonView } from '@/components/lesson-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useChapter, useLesson, useQuestions } from '@/hooks/use-content';
import { useLastRead } from '@/hooks/use-last-read';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { usePreferences } from '@/hooks/use-preferences';
import { useReadingProgress } from '@/hooks/use-reading-progress';
import { useStudyGoal } from '@/hooks/use-study-goal';
import { useTranslation } from '@/hooks/use-translation';

// Lecture d'un chapitre : le lecteur pédagogique affiche le texte arabe et sa
// traduction dans la langue choisie. L'audio et la vidéo karaoké (déjà prévus
// dans le modèle) s'ajouteront ensuite. La progression est calculée au défilement.
export default function ChapterReadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { chapter, loading } = useChapter(id);
  const { lesson, loading: loadingLesson } = useLesson(id);
  const { questions } = useQuestions(id);
  const { getProgress, setProgress, resetProgress } = useReadingProgress();
  const { recordRead } = useLastRead();
  const { addStudySeconds } = useStudyGoal();
  const { readingScale, stepReadingScale } = usePreferences();
  const { isBookmarked, toggle } = useBookmarks();

  // Mémorise ce chapitre comme « dernier lu » pour la reprise sur l'accueil.
  useEffect(() => {
    if (chapter) recordRead(chapter);
    // On enregistre au (re)chargement du chapitre ; recordRead est stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter?.id]);

  // Compte le temps d'étude tant que l'écran du chapitre est affiché.
  useFocusEffect(
    useCallback(() => {
      const id = setInterval(() => addStudySeconds(10), 10000);
      return () => clearInterval(id);
    }, [addStudySeconds]),
  );

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
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={Spacing.three}>
            <ThemedText type="link" themeColor="textSecondary">
              ← {t('common.back')}
            </ThemedText>
          </Pressable>
          {chapter ? (
            <Pressable
              onPress={() => toggle(chapter)}
              hitSlop={Spacing.two}
              accessibilityRole="button"
              accessibilityLabel={t(isBookmarked(chapter.id) ? 'bookmark.remove' : 'bookmark.add')}>
              <ThemedText style={styles.bookmarkIcon}>
                {isBookmarked(chapter.id) ? '★' : '☆'}
              </ThemedText>
            </Pressable>
          ) : null}
        </View>

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
            <View style={styles.metaRow}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                {t('chapter.meta', { order: chapter.order, pct: Math.round(progress * 100) })}
              </ThemedText>
              <View style={styles.fontControls}>
                <Pressable
                  onPress={() => stepReadingScale(-1)}
                  hitSlop={Spacing.two}
                  accessibilityRole="button"
                  accessibilityLabel={t('reading.smaller')}
                  style={({ pressed }) => [styles.fontStep, pressed && styles.pressed]}>
                  <ThemedText style={styles.fontStepSmall}>A−</ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => stepReadingScale(1)}
                  hitSlop={Spacing.two}
                  accessibilityRole="button"
                  accessibilityLabel={t('reading.larger')}
                  style={({ pressed }) => [styles.fontStep, pressed && styles.pressed]}>
                  <ThemedText style={styles.fontStepLarge}>A+</ThemedText>
                </Pressable>
              </View>
            </View>
            <ThemedText type="title" style={styles.title}>
              {chapter.title}
            </ThemedText>

            <ThemedText style={[styles.lead, { fontSize: 18 * readingScale, lineHeight: 28 * readingScale }]}>
              {chapter.description}
            </ThemedText>

            {lesson ? (
              <>
                <LessonView segments={lesson.segments} title={chapter.title} />

                {lesson.audioUrl ? <AudioPlayer uri={lesson.audioUrl} title={chapter.title} /> : null}

                <ThemedView type="backgroundElement" style={styles.notice}>
                  <ThemedText type="smallBold">{t('chapter.sampleNoticeTitle')}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {t('chapter.sampleNoticeBody')}
                  </ThemedText>
                </ThemedView>

                <ThemedText type="small" themeColor="textSecondary" style={styles.mediaSoon}>
                  {t('chapter.mediaSoon')}
                </ThemedText>
              </>
            ) : loadingLesson ? (
              <ThemedText themeColor="textSecondary">{t('common.loading')}</ThemedText>
            ) : (
              <ThemedView type="backgroundElement" style={styles.notice}>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('chapter.lessonPending')}
                </ThemedText>
              </ThemedView>
            )}

            {questions.length > 0 ? (
              <Pressable
                onPress={() => router.push({ pathname: '/quiz/[id]', params: { id: chapter.id } })}
                style={({ pressed }) => [styles.quizButton, pressed && styles.quizButtonPressed]}>
                <ThemedText style={styles.quizButtonLabel}>{t('chapter.startQuiz')}</ThemedText>
              </Pressable>
            ) : null}

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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  bookmarkIcon: {
    fontSize: 22,
    color: '#E0BE6D',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fontControls: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  fontStep: {
    minWidth: 40,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 238, 218, 0.3)',
    alignItems: 'center',
  },
  fontStepSmall: {
    color: '#F5EEDA',
    fontSize: 13,
    fontWeight: '700',
  },
  fontStepLarge: {
    color: '#F5EEDA',
    fontSize: 17,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.6,
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
  notice: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  mediaSoon: {
    textAlign: 'center',
  },
  quizButton: {
    backgroundColor: '#0C5A44',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  quizButtonPressed: {
    opacity: 0.8,
  },
  quizButtonLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
