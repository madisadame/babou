import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QuizRunner } from '@/components/quiz-runner';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useQuestions } from '@/hooks/use-content';
import { useQuizResults } from '@/hooks/use-quiz-results';
import { useReview } from '@/hooks/use-review';
import { useTranslation } from '@/hooks/use-translation';

// Quiz de fin de chapitre : joue les questions du chapitre puis enregistre le
// résultat (statuts) et alimente la révision espacée (voir use-review).
export default function QuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { questions, loading } = useQuestions(id);
  const { recordResult } = useQuizResults();
  const { recordOutcomes } = useReview();

  if (loading || questions.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText themeColor="textSecondary" style={styles.centered}>
            {loading ? t('common.loading') : t('quiz.empty')}
          </ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <QuizRunner
      questions={questions}
      onFinish={(outcomes) => {
        recordResult(id, outcomes);
        recordOutcomes(
          outcomes.map((o) => ({ questionId: o.questionId, chapterId: id, correct: o.correct })),
        );
      }}
      onExit={() => router.back()}
      exitLabel={t('quiz.backToChapter')}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.four },
  centered: { textAlign: 'center', marginTop: Spacing.five },
});
