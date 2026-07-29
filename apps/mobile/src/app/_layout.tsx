import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { AccessGate } from '@/components/access-gate';
import { ErrorBoundary } from '@/components/error-boundary';
import { StarrySky } from '@/components/starry-sky';
import { AccessProvider } from '@/hooks/use-access';
import { AuthProvider } from '@/hooks/use-auth';
import { BookmarksProvider } from '@/hooks/use-bookmarks';
import { DownloadsProvider } from '@/hooks/use-downloads';
import { FinalQuizProvider } from '@/hooks/use-final-quiz';
import { LastReadProvider } from '@/hooks/use-last-read';
import { PreferencesProvider } from '@/hooks/use-preferences';
import { ProfileProvider } from '@/hooks/use-profile';
import { StudyGoalProvider } from '@/hooks/use-study-goal';
import { QuizResultsProvider } from '@/hooks/use-quiz-results';
import { ReadingProgressProvider } from '@/hooks/use-reading-progress';
import { ReviewProvider } from '@/hooks/use-review';

export default function RootLayout() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <AccessProvider>
      <PreferencesProvider>
        <ReadingProgressProvider>
          <QuizResultsProvider>
            <DownloadsProvider>
              <LastReadProvider>
              <StudyGoalProvider>
              <ReviewProvider>
              <FinalQuizProvider>
              <BookmarksProvider>
              <ProfileProvider>
              {/* Le ciel étoilé est rendu une seule fois, en fond de toute
                  l'app : il reste continu d'un écran à l'autre. Les scènes de
                  navigation sont transparentes pour le laisser apparaître. */}
              <View style={{ flex: 1 }}>
                <StarrySky />
                <AccessGate />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: 'transparent' },
                    animation: 'fade',
                  }}
                />
              </View>
              <StatusBar style="light" />
              </ProfileProvider>
              </BookmarksProvider>
              </FinalQuizProvider>
              </ReviewProvider>
              </StudyGoalProvider>
              </LastReadProvider>
            </DownloadsProvider>
          </QuizResultsProvider>
        </ReadingProgressProvider>
      </PreferencesProvider>
      </AccessProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}
