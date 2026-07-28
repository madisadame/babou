import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AudioPlayer } from '@/components/audio-player';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { fetchSiteContent } from '@/data/supabase/site-content';
import { LOCALES } from '@/domain/locale';
import type { TranslationKey } from '@/i18n';
import { usePreferences } from '@/hooks/use-preferences';
import { useTranslation } from '@/hooks/use-translation';

const CREAM = '#F5EEDA';
const CREAM_DIM = 'rgba(245,238,218,0.72)';
const GREEN = '#0C5A44';

// Écran d'accueil : message d'introduction présentant le cadre de Babou et
// choix de la langue, sur un ciel étoilé animé (voir StarrySky).
export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { language, setLanguage } = usePreferences();

  // Textes de l'accueil éditables depuis l'admin (repli sur le texte par défaut).
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  useFocusEffect(
    useCallback(() => {
      fetchSiteContent().then(setOverrides);
    }, []),
  );
  const hc = (key: TranslationKey) => overrides[key] || t(key);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText type="title" style={styles.title}>
            {hc('home.title')}
          </ThemedText>

          {overrides['home.audioUrl'] ? (
            <View style={styles.homeAudio}>
              <ThemedText type="smallBold" style={styles.homeAudioLabel}>
                🔊 {t('home.audioLabel')}
              </ThemedText>
              <AudioPlayer uri={overrides['home.audioUrl']} title={hc('home.title')} />
            </View>
          ) : null}

          <ThemedText style={styles.paragraph}>{hc('home.intro.p1')}</ThemedText>
          <ThemedText style={styles.paragraph}>{hc('home.intro.p2')}</ThemedText>
          <ThemedText style={styles.paragraph}>{hc('home.intro.p3')}</ThemedText>
          <ThemedText style={styles.paragraph}>{hc('home.intro.p4')}</ThemedText>

          <ThemedText style={styles.invocation}>{hc('home.invocation')}</ThemedText>

          <ThemedText type="smallBold" style={styles.langLabel}>
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
                    selected ? styles.langChipOn : styles.langChipOff,
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText
                    type="smallBold"
                    style={{ color: selected ? GREEN : CREAM }}>
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
            <ThemedText style={styles.ctaLabel}>{hc('home.cta')}</ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
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
    color: CREAM,
  },
  homeAudio: {
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  homeAudioLabel: {
    color: CREAM,
    letterSpacing: 0.5,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 26,
    color: CREAM,
  },
  invocation: {
    fontSize: 16,
    lineHeight: 26,
    fontStyle: 'italic',
    marginTop: Spacing.two,
    color: CREAM_DIM,
  },
  langLabel: {
    marginTop: Spacing.three,
    letterSpacing: 1,
    color: CREAM_DIM,
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
  langChipOn: {
    backgroundColor: CREAM,
  },
  langChipOff: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  pressed: {
    opacity: 0.6,
  },
  cta: {
    backgroundColor: CREAM,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  ctaPressed: {
    opacity: 0.8,
  },
  ctaLabel: {
    color: GREEN,
    fontSize: 16,
    fontWeight: '700',
  },
});
