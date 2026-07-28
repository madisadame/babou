import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { StarrySky } from '@/components/starry-sky';
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
          </QuizResultsProvider>
        </ReadingProgressProvider>
      </PreferencesProvider>
    </AuthProvider>
  );
}
