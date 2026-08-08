import { DefaultTheme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, View, type ViewStyle } from 'react-native';

// Le masquage du splash est déclenché par le MONTAGE de l'arbre React, jamais
// par la disponibilité des données. Conséquence : si Supabase, RevenueCat ou
// tout autre service est injoignable au démarrage, l'utilisateur voit
// l'interface (ou l'écran de l'ErrorBoundary), et non un splash figé.
//
// Ce n'est pas un délai d'attente : rien n'est chronométré. On prend
// simplement la main sur le masquage pour le lier à un événement certain.
//
// Limite à connaître : ceci ne protège que ce qui survient APRÈS le démarrage
// du JS. Une exception à l'évaluation du graphe de modules empêche React de
// monter, et aucun garde-fou écrit en JS ne peut alors s'exécuter — c'était le
// cas du blocage causé par les versions dupliquées d'expo-asset.
SplashScreen.preventAutoHideAsync().catch(() => {
  // déjà masqué ou API indisponible : sans conséquence
});

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
  // Premier effet après le montage : l'arbre est vivant, on rend la main.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {
      // déjà masqué : sans conséquence
    });
  }, []);

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
