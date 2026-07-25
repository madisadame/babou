import { Stack } from 'expo-router';

import { PreferencesProvider } from '@/hooks/use-preferences';
import { QuizResultsProvider } from '@/hooks/use-quiz-results';
import { ReadingProgressProvider } from '@/hooks/use-reading-progress';

export default function RootLayout() {
  return (
    <PreferencesProvider>
      <ReadingProgressProvider>
        <QuizResultsProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </QuizResultsProvider>
      </ReadingProgressProvider>
    </PreferencesProvider>
  );
}
