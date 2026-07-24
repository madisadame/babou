import { Stack } from 'expo-router';

import { ReadingProgressProvider } from '@/hooks/use-reading-progress';

export default function RootLayout() {
  return (
    <ReadingProgressProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ReadingProgressProvider>
  );
}
