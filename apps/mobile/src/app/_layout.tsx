import { DefaultTheme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, type ViewStyle } from 'react-native';

// Le navigateur react-navigation (utilisé par expo-router) peint le fond de son
// thème par défaut = gris clair `rgb(242,242,242)`. Sur le web, ce fond opaque
// recouvrait le ciel étoilé et rendait le texte crème illisible (sur natif il
// ne couvre pas). On le rend transparent pour que le fond nuit reste visible
// sur les trois plateformes. C'est la cause racine du bug d'affichage web.
DefaultTheme.colors.background = 'transparent';

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
import { ShowcaseProvider } from '@/hooks/use-showcase';

// Conteneur racine : fond nuit explicite (sur natif il est couvert par le ciel
// étoilé, aucun changement ; sur web il peint le fond). Sur web on force en plus
// une hauteur pleine (100vh) pour que le fond remplisse toute la fenêtre, comme
// le ciel étoilé le fait nativement.
const rootStyle: ViewStyle = {
  flex: 1,
  backgroundColor: '#083D2C',
  // '100vh' est valide sur react-native-web mais pas typé par RN → cast.
  ...(Platform.OS === 'web' ? ({ minHeight: '100vh' } as unknown as ViewStyle) : null),
};

export default function RootLayout() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <AccessProvider>
      <ShowcaseProvider>
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
              <View style={rootStyle}>
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
      </ShowcaseProvider>
      </AccessProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}
