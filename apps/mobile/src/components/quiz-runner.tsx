import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Translations } from '@/domain/lesson';
import type { Question } from '@/domain/quiz';
import { usePreferences } from '@/hooks/use-preferences';
import type { QuestionOutcome } from '@/hooks/use-quiz-results';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

const CORRECT = '#2e9e5b';
const WRONG = '#e5484d';

type QuizRunnerProps = {
  questions: Question[];
  // Appelé quand l'utilisateur atteint l'écran de résultats (pour enregistrer).
  onFinish: (outcomes: QuestionOutcome[]) => void;
  onExit: () => void;
  exitLabel: string;
  title?: string;
};

// Joue une liste de questions (une par une, avec correction) puis affiche les
// résultats. Réutilisé par le quiz de chapitre et par la session de révision.
export function QuizRunner({ questions, onFinish, onExit, exitLabel, title }: QuizRunnerProps) {
  const theme = useTheme();
  const { t, locale } = useTranslation();
  const { correctionMode } = usePreferences();

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<'answering' | 'results'>('answering');

  const tr = (value: Translations) => value[locale] ?? value.fr ?? '';

  const outcomes = (): QuestionOutcome[] =>
    questions.map((q) => ({ questionId: q.id, correct: answers[q.id] === q.correctChoiceId }));

  const restart = () => {
    setAnswers({});
    setIndex(0);
    setPhase('answering');
  };

  const goToResults = () => {
    onFinish(outcomes());
    setPhase('results');
  };

  const header = (
    <Pressable onPress={onExit} hitSlop={Spacing.three} style={styles.back}>
      <ThemedText type="link" themeColor="textSecondary">
        ← {t('common.back')}
      </ThemedText>
    </Pressable>
  );

  // ---- Écran de résultats ----
  if (phase === 'results') {
    const results = outcomes();
    const correct = results.filter((o) => o.correct).length;
    const total = results.length;
    const rate = total > 0 ? Math.round((correct / total) * 100) : 0;
    const toReview = total - correct;

    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {header}
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <ThemedText type="title" style={styles.title}>
              {title ?? t('quiz.resultsTitle')}
            </ThemedText>

            <ThemedView type="backgroundElement" style={styles.summary}>
              <ThemedText type="subtitle" style={styles.score}>
                {t('quiz.resultsScore', { correct, total })}
              </ThemedText>
              <ThemedText themeColor="textSecondary">
                {t('quiz.resultsRate', { pct: rate })}
              </ThemedText>
              <ThemedText themeColor="textSecondary">
                {t('quiz.resultsMastered', { count: correct })}
              </ThemedText>
              <ThemedText themeColor="textSecondary">
                {t('quiz.resultsToReview', { count: toReview })}
              </ThemedText>
            </ThemedView>

            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.reviewTitle}>
              {t('quiz.reviewTitle')}
            </ThemedText>
            {questions.map((question) => {
              const isCorrect = answers[question.id] === question.correctChoiceId;
              const correctChoice = question.choices.find((c) => c.id === question.correctChoiceId);
              return (
                <ThemedView key={question.id} type="backgroundElement" style={styles.reviewItem}>
                  <ThemedText style={styles.reviewPrompt}>{tr(question.prompt)}</ThemedText>
                  <ThemedText type="smallBold" style={{ color: isCorrect ? CORRECT : WRONG }}>
                    {isCorrect ? t('quiz.correct') : t('quiz.incorrect')}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {t('quiz.correctAnswer', { answer: correctChoice ? tr(correctChoice.text) : '' })}
                  </ThemedText>
                  {question.explanation && tr(question.explanation) ? (
                    <ThemedText type="small" themeColor="textSecondary">
                      {tr(question.explanation)}
                    </ThemedText>
                  ) : null}
                </ThemedView>
              );
            })}

            <Pressable
              onPress={restart}
              style={({ pressed }) => [styles.cta, pressed && styles.pressed]}>
              <ThemedText style={styles.ctaLabel}>{t('quiz.retry')}</ThemedText>
            </Pressable>
            <Pressable onPress={onExit} hitSlop={Spacing.two} style={styles.secondary}>
              <ThemedText type="link" themeColor="textSecondary">
                {exitLabel}
              </ThemedText>
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    );
  }

  // ---- Écran de question ----
  const question: Question = questions[index];
  const answered = answers[question.id] !== undefined;
  const revealed = correctionMode === 'immediate' && answered;
  const isLast = index === questions.length - 1;

  const selectChoice = (choiceId: string) => {
    if (revealed) return;
    setAnswers((prev) => ({ ...prev, [question.id]: choiceId }));
  };

  const choiceBackground = (choiceId: string): string => {
    const selected = answers[question.id] === choiceId;
    if (revealed) {
      if (choiceId === question.correctChoiceId) return CORRECT;
      if (selected) return WRONG;
      return theme.backgroundElement;
    }
    return selected ? '#0C5A44' : theme.backgroundElement;
  };

  const choiceTextSelected = (choiceId: string): boolean => {
    const selected = answers[question.id] === choiceId;
    if (revealed) return choiceId === question.correctChoiceId || selected;
    return selected;
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {header}
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            {t('quiz.progress', { current: index + 1, total: questions.length })}
          </ThemedText>
          <ThemedText type="title" style={styles.prompt}>
            {tr(question.prompt)}
          </ThemedText>

          <View style={styles.choices}>
            {question.choices.map((choice) => (
              <Pressable
                key={choice.id}
                onPress={() => selectChoice(choice.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: answers[question.id] === choice.id }}
                style={({ pressed }) => [
                  styles.choice,
                  { backgroundColor: choiceBackground(choice.id) },
                  pressed && !revealed && styles.pressed,
                ]}>
                <ThemedText
                  style={choiceTextSelected(choice.id) ? styles.choiceTextSelected : undefined}>
                  {tr(choice.text)}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          {revealed ? (
            <ThemedView type="backgroundElement" style={styles.correction}>
              <ThemedText
                type="smallBold"
                style={{
                  color: answers[question.id] === question.correctChoiceId ? CORRECT : WRONG,
                }}>
                {answers[question.id] === question.correctChoiceId
                  ? t('quiz.correct')
                  : t('quiz.incorrect')}
              </ThemedText>
              {tr(question.explanation) ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {tr(question.explanation)}
                </ThemedText>
              ) : null}
            </ThemedView>
          ) : null}

          {answered ? (
            <Pressable
              onPress={() => (isLast ? goToResults() : setIndex((i) => i + 1))}
              style={({ pressed }) => [styles.cta, pressed && styles.pressed]}>
              <ThemedText style={styles.ctaLabel}>
                {isLast ? t('quiz.seeResults') : t('quiz.next')}
              </ThemedText>
            </Pressable>
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
  title: { fontSize: 34, lineHeight: 40 },
  prompt: { fontSize: 24, lineHeight: 32 },
  choices: { gap: Spacing.two },
  choice: { paddingVertical: Spacing.three, paddingHorizontal: Spacing.four, borderRadius: Spacing.three },
  choiceTextSelected: { color: '#ffffff', fontWeight: '600' },
  correction: { borderRadius: Spacing.three, padding: Spacing.four, gap: Spacing.two },
  summary: { borderRadius: Spacing.three, padding: Spacing.four, gap: Spacing.one },
  score: { fontSize: 24, lineHeight: 30 },
  reviewTitle: { marginTop: Spacing.two, letterSpacing: 1 },
  reviewItem: { borderRadius: Spacing.three, padding: Spacing.four, gap: Spacing.one },
  reviewPrompt: { fontSize: 16, fontWeight: '600' },
  cta: {
    backgroundColor: '#0C5A44',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  ctaLabel: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  secondary: { alignSelf: 'center', marginTop: Spacing.one },
  pressed: { opacity: 0.7 },
});
