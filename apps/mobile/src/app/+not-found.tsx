import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTranslation } from '@/hooks/use-translation';

const CREAM = '#F5EEDA';
const GREEN = '#0C5A44';

// Route inconnue. Sans cet écran, expo-router affiche son écran « Unmatched
// Route » par défaut : en anglais, hors charte, avec un lien « Sitemap ».
export default function NotFoundScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <ThemedText style={styles.emoji}>🌙</ThemedText>
          <ThemedText type="title" style={styles.title}>
            {t('notFound.title')}
          </ThemedText>
          <ThemedText style={styles.paragraph}>{t('notFound.body')}</ThemedText>
          <Pressable
            onPress={() => router.replace('/')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}>
            <ThemedText style={styles.primaryLabel}>{t('notFound.cta')}</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four },
  content: { flex: 1, justifyContent: 'center', gap: Spacing.three },
  emoji: { fontSize: 52, textAlign: 'center' },
  title: { fontSize: 30, lineHeight: 38, textAlign: 'center' },
  paragraph: { fontSize: 16, lineHeight: 26, color: CREAM, textAlign: 'center' },
  primaryBtn: {
    backgroundColor: CREAM,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  primaryLabel: { color: GREEN, fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.8 },
});
