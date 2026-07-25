import { Stack } from 'expo-router';

import { AuthProvider } from '@/hooks/use-auth';
import { PreferencesProvider } from '@/hooks/use-preferences';
import { QuizResultsProvider } from '@/hooks/use-quiz-results';
import { ReadingProgressProvider } from '@/hooks/use-reading-progress';

export default function RootLayout() {
  return (
    <AuthProvider>
      <PreferencesProvider>
        <ReadingProgressProvider>
          <QuizResultsProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </QuizResultsProvider>
        </ReadingProgressProvider>
      </PreferencesProvider>
    </AuthProvider>
  );
}
