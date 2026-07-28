import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { StarrySky } from '@/components/starry-sky';
import { AuthProvider } from '@/hooks/use-auth';
import { DownloadsProvider } from '@/hooks/use-downloads';
import { FinalQuizProvider } from '@/hooks/use-final-quiz';
import { LastReadProvider } from '@/hooks/use-last-read';
import { PreferencesProvider } from '@/hooks/use-preferences';
import { StudyGoalProvider } from '@/hooks/use-study-goal';
import { QuizResultsProvider } from '@/hooks/use-quiz-results';
import { ReadingProgressProvider } from '@/hooks/use-reading-progress';
import { ReviewProvider } from '@/hooks/use-review';

export default function RootLayout() {
  return (
    <AuthProvider>
      <PreferencesProvider>
        <ReadingProgressProvider>
          <QuizResultsProvider>
            <DownloadsProvider>
              <LastReadProvider>
              <StudyGoalProvider>
              <ReviewProvider>
              <FinalQuizProvider>
              {/* Le ciel étoilé est rendu une seule fois, en fond de toute
                  l'app : il reste continu d'un écran à l'autre. Les scènes de
                  navigation sont transparentes pour le laisser apparaître. */}
              <View style={{ flex: 1 }}>
                <StarrySky />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: 'transparent' },
                    animation: 'fade',
                  }}
                />
              </View>
              <StatusBar style="light" />
              </FinalQuizProvider>
              </ReviewProvider>
              </StudyGoalProvider>
              </LastReadProvider>
            </DownloadsProvider>
          </QuizResultsProvider>
        </ReadingProgressProvider>
      </PreferencesProvider>
    </AuthProvider>
  );
}
