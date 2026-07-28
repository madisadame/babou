import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProgressBar } from '@/components/progress-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { contentRepository } from '@/data/content-repository';
import type { Translations } from '@/domain/lesson';
import type { Question } from '@/domain/quiz';
import { STEP_CORRECT, STEP_WRONG, useFinalQuiz } from '@/hooks/use-final-quiz';
import { useQuizResults } from '@/hooks/use-quiz-results';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

const CORRECT = '#2e9e5b';
const WRONG = '#e5484d';

function pickRandom(pool: Question[], excludeId: string | null): Question {
  if (pool.length === 1) return pool[0];
  let q = pool[Math.floor(Math.random() * pool.length)];
  while (q.id === excludeId) q = pool[Math.floor(Math.random() * pool.length)];
  return q;
}

// Quiz final d'un livre : questions tirées au hasard des chapitres déjà
// quizzés. Barre de progression persistante (+2 % / bonne réponse, −5 % /
// erreur). Validé à 100 %.
export default function FinalQuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); // id = bookId
  const router = useRouter();
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const { getResult } = useQuizResults();
  const { getProgress, setProgress } = useFinalQuiz();

  const [pool, setPool] = useState<Question[] | null>(null);
  const [current, setCurrent] = useState<Question | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [pct, setPct] = useState<number>(() => getProgress(id));
  const [validated, setValidated] = useState<boolean>(getProgress(id) >= 100);

  const tr = (value: Translations) => value[locale] ?? value.fr ?? '';

  useEffect(() => {
    let active = true;
    (async () => {
      const chapters = await contentRepository.getChapters(id);
      const collected: Question[] = [];
      for (const chapter of chapters) {
        if (!getResult(chapter.id)) continue; // seulement les chapitres déjà quizzés
        const questions = await contentRepository.getQuestions(chapter.id);
        collected.push(...questions);
      }
      if (!active) return;
      setPool(collected);
      if (collected.length) setCurrent(pickRandom(collected, null));
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const back = (
    <Pressable onPress={() => router.back()} hitSlop={Spacing.three} style={styles.back}>
      <ThemedText type="link" themeColor="textSecondary">
        ← {t('common.back')}
      </ThemedText>
    </Pressable>
  );

  const selectChoice = (choiceId: string) => {
    if (selected || !current) return;
    setSelected(choiceId);
    const correct = choiceId === current.correctChoiceId;
    const next = Math.max(0, Math.min(100, pct + (correct ? STEP_CORRECT : -STEP_WRONG)));
    setPct(next);
    setProgress(id, next);
  };

  const goNext = () => {
    if (pct >= 100) {
      setValidated(true);
      return;
    }
    setSelected(null);
    if (pool) setCurrent(pickRandom(pool, current?.id ?? null));
  };

  // ---- États particuliers ----
  if (pool === null) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {back}
          <ThemedText themeColor="textSecondary" style={styles.centered}>
            {t('common.loading')}
          </ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (pool.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {back}
          <ThemedText type="title" style={styles.title}>
            {t('finalQuiz.title')}
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.centered}>
            {t('finalQuiz.locked')}
          </ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (validated) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {back}
          <View style={styles.validated}>
            <ThemedText style={styles.trophy}>🏆</ThemedText>
            <ThemedText type="title" style={styles.title}>
              {t('finalQuiz.validatedTitle')}
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.centered}>
              {t('finalQuiz.validatedBody')}
            </ThemedText>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.cta, pressed && styles.pressed]}>
              <ThemedText style={styles.ctaLabel}>{t('finalQuiz.finish')}</ThemedText>
            </Pressable>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // ---- Question en cours ----
  const question = current as Question;
  const answered = selected !== null;

  const choiceBackground = (choiceId: string): string => {
    if (answered) {
      if (choiceId === question.correctChoiceId) return CORRECT;
      if (choiceId === selected) return WRONG;
      return theme.backgroundElement;
    }
    return theme.backgroundElement;
  };
  const choiceTextSelected = (choiceId: string): boolean =>
    answered && (choiceId === question.correctChoiceId || choiceId === selected);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {back}
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText type="title" style={styles.title}>
            {t('finalQuiz.title')}
          </ThemedText>

          <ThemedView type="backgroundElement" style={styles.progressBox}>
            <View style={styles.progressRow}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                {t('finalQuiz.progressLabel')}
              </ThemedText>
              <ThemedText type="smallBold" style={styles.pct}>
                {pct} %
              </ThemedText>
            </View>
            <ProgressBar value={pct / 100} />
            <ThemedText type="small" themeColor="textSecondary">
              {t('finalQuiz.rules')}
            </ThemedText>
          </ThemedView>

          <ThemedText type="subtitle" style={styles.prompt}>
            {tr(question.prompt)}
          </ThemedText>

          <View style={styles.choices}>
            {question.choices.map((choice) => (
              <Pressable
                key={choice.id}
                onPress={() => selectChoice(choice.id)}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.choice,
                  { backgroundColor: choiceBackground(choice.id) },
                  pressed && !answered && styles.pressed,
                ]}>
                <ThemedText
                  style={choiceTextSelected(choice.id) ? styles.choiceTextSelected : undefined}>
                  {tr(choice.text)}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          {answered ? (
            <>
              <ThemedView type="backgroundElement" style={styles.correction}>
                <ThemedText
                  type="smallBold"
                  style={{ color: selected === question.correctChoiceId ? CORRECT : WRONG }}>
                  {selected === question.correctChoiceId
                    ? `${t('quiz.correct')}  +${STEP_CORRECT} %`
                    : `${t('quiz.incorrect')}  −${STEP_WRONG} %`}
                </ThemedText>
                {tr(question.explanation) ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {tr(question.explanation)}
                  </ThemedText>
                ) : null}
              </ThemedView>

              <Pressable
                onPress={goNext}
                style={({ pressed }) => [styles.cta, pressed && styles.pressed]}>
                <ThemedText style={styles.ctaLabel}>
                  {pct >= 100 ? t('finalQuiz.seeResult') : t('finalQuiz.next')}
                </ThemedText>
              </Pressable>
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.four },
  back: { marginBottom: Spacing.three },
  content: { gap: Spacing.three, paddingBottom: Spacing.six },
  title: { fontSize: 30, lineHeight: 36 },
  progressBox: { borderRadius: Spacing.three, padding: Spacing.four, gap: Spacing.two },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pct: { color: '#F5EEDA', fontVariant: ['tabular-nums'] },
  prompt: { fontSize: 22, lineHeight: 30 },
  choices: { gap: Spacing.two },
  choice: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
  },
  choiceTextSelected: { color: '#ffffff', fontWeight: '600' },
  correction: { borderRadius: Spacing.three, padding: Spacing.four, gap: Spacing.two },
  cta: {
    backgroundColor: '#0C5A44',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  ctaLabel: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  validated: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.three },
  trophy: { fontSize: 64 },
  centered: { textAlign: 'center', marginTop: Spacing.two },
  pressed: { opacity: 0.7 },
});
