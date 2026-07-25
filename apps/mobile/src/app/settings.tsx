import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { LOCALES } from '@/domain/locale';
import type { CorrectionMode } from '@/domain/quiz';
import { usePreferences } from '@/hooks/use-preferences';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const { language, setLanguage, correctionMode, setCorrectionMode } = usePreferences();

  const correctionOptions: { value: CorrectionMode; label: string }[] = [
    { value: 'immediate', label: t('settings.correctionImmediate') },
    { value: 'end', label: t('settings.correctionEnd') },
  ];

  const renderOption = (selected: boolean, label: string, onPress: () => void) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.option,
        { backgroundColor: selected ? '#3c87f7' : theme.backgroundElement },
        pressed && styles.pressed,
      ]}>
      <ThemedText type="smallBold" style={selected ? styles.optionSelected : undefined}>
        {label}
      </ThemedText>
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()} hitSlop={Spacing.three} style={styles.back}>
          <ThemedText type="link" themeColor="textSecondary">
            ← {t('common.back')}
          </ThemedText>
        </Pressable>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText type="title" style={styles.title}>
            {t('settings.title')}
          </ThemedText>

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.section}>
            {t('settings.languageSection')}
          </ThemedText>
          <View style={styles.row}>
            {LOCALES.map((option) =>
              renderOption(option.value === language, option.label, () => setLanguage(option.value)),
            )}
          </View>

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.section}>
            {t('settings.correctionSection')}
          </ThemedText>
          <View style={styles.rowWrap}>
            {correctionOptions.map((option) =>
              renderOption(option.value === correctionMode, option.label, () =>
                setCorrectionMode(option.value),
              ),
            )}
          </View>
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
    paddingTop: Spacing.four,
  },
  back: {
    marginBottom: Spacing.three,
  },
  content: {
    paddingBottom: Spacing.six,
    gap: Spacing.two,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    marginBottom: Spacing.two,
  },
  section: {
    marginTop: Spacing.three,
    letterSpacing: 1,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  option: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.five,
  },
  optionSelected: {
    color: '#ffffff',
  },
  pressed: {
    opacity: 0.6,
  },
});
