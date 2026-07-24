import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { LOCALES } from '@/domain/locale';
import { usePreferences } from '@/hooks/use-preferences';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

// Écran d'accueil : message d'introduction présentant le cadre de Babou et
// choix de la langue, avant d'accéder à la bibliothèque.
export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const { language, setLanguage } = usePreferences();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText type="title" style={styles.title}>
            {t('home.title')}
          </ThemedText>

          <ThemedText style={styles.paragraph}>{t('home.intro.p1')}</ThemedText>
          <ThemedText style={styles.paragraph}>{t('home.intro.p2')}</ThemedText>
          <ThemedText style={styles.paragraph}>{t('home.intro.p3')}</ThemedText>
          <ThemedText style={styles.paragraph}>{t('home.intro.p4')}</ThemedText>

          <ThemedText themeColor="textSecondary" style={styles.invocation}>
            {t('home.invocation')}
          </ThemedText>

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.langLabel}>
            {t('language.label')}
          </ThemedText>
          <View style={styles.langRow}>
            {LOCALES.map((option) => {
              const selected = option.value === language;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setLanguage(option.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={option.label}
                  style={({ pressed }) => [
                    styles.langChip,
                    { backgroundColor: selected ? '#3c87f7' : theme.backgroundElement },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText
                    type="smallBold"
                    style={selected ? styles.langChipSelected : undefined}>
                    {option.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={() => router.push('/library')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
            <ThemedText style={styles.ctaLabel}>{t('home.cta')}</ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  content: {
    paddingTop: Spacing.five,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    marginBottom: Spacing.two,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 26,
  },
  invocation: {
    fontSize: 16,
    lineHeight: 26,
    fontStyle: 'italic',
    marginTop: Spacing.two,
  },
  langLabel: {
    marginTop: Spacing.three,
    letterSpacing: 1,
  },
  langRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  langChip: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.five,
  },
  langChipSelected: {
    color: '#ffffff',
  },
  pressed: {
    opacity: 0.6,
  },
  cta: {
    backgroundColor: '#3c87f7',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  ctaPressed: {
    opacity: 0.8,
  },
  ctaLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
