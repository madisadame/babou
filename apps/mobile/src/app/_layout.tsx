import { Stack } from 'expo-router';

import { PreferencesProvider } from '@/hooks/use-preferences';
import { ReadingProgressProvider } from '@/hooks/use-reading-progress';

export default function RootLayout() {
  return (
    <PreferencesProvider>
      <ReadingProgressProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </ReadingProgressProvider>
    </PreferencesProvider>
  );
}
