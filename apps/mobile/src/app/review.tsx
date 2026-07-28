import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QuizRunner } from '@/components/quiz-runner';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { contentRepository } from '@/data/content-repository';
import type { Question } from '@/domain/quiz';
import { useReview } from '@/hooks/use-review';
import { useTranslation } from '@/hooks/use-translation';

// Session de révision : rassemble toutes les questions « dues » (révision
// espacée) de tous les chapitres et les joue via le QuizRunner. Le résultat
// reprogramme chaque question (réussie → repoussée, ratée → à revoir).
export default function ReviewScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { getDueItems, recordOutcomes } = useReview();
  const [questions, setQuestions] = useState<Question[] | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const due = getDueItems();
      const byChapter = new Map<string, Set<string>>();
      for (const d of due) {
        const set = byChapter.get(d.chapterId) ?? new Set<string>();
        set.add(d.questionId);
        byChapter.set(d.chapterId, set);
      }
      const collected: Question[] = [];
      for (const [chapterId, ids] of byChapter) {
        const qs = await contentRepository.getQuestions(chapterId);
        for (const q of qs) if (ids.has(q.id)) collected.push(q);
      }
      // Mélange léger pour varier l'ordre d'une session à l'autre.
      for (let i = collected.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [collected[i], collected[j]] = [collected[j], collected[i]];
      }
      if (active) setQuestions(collected);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chapterOf = useMemo(() => {
    const map = new Map<string, string>();
    for (const q of questions ?? []) map.set(q.id, q.chapterId);
    return map;
  }, [questions]);

  if (questions === null || questions.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <Pressable onPress={() => router.back()} hitSlop={Spacing.three} style={styles.back}>
            <ThemedText type="link" themeColor="textSecondary">
              ← {t('common.back')}
            </ThemedText>
          </Pressable>
          <ThemedText themeColor="textSecondary" style={styles.centered}>
            {questions === null ? t('common.loading') : t('review.empty')}
          </ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <QuizRunner
      questions={questions}
      title={t('review.title')}
      onFinish={(outcomes) =>
        recordOutcomes(
          outcomes.map((o) => ({
            questionId: o.questionId,
            chapterId: chapterOf.get(o.questionId) ?? '',
            correct: o.correct,
          })),
        )
      }
      onExit={() => router.back()}
      exitLabel={t('review.finish')}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.four },
  back: { marginBottom: Spacing.three },
  centered: { textAlign: 'center', marginTop: Spacing.five },
});
