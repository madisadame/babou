import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
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
import { useReadingProgress } from '@/hooks/use-reading-progress';
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

  // Mémorise ce chapitre comme « dernier lu » pour la reprise sur l'accueil.
  useEffect(() => {
    if (chapter) recordRead(chapter);
    // On enregistre au (re)chargement du chapitre ; recordRead est stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapter?.id]);

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

            {lesson ? (
              <>
                <LessonView segments={lesson.segments} />

                {lesson.audioUrl ? <AudioPlayer uri={lesson.audioUrl} /> : null}

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
