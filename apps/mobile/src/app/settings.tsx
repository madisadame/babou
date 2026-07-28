import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { LOCALES } from '@/domain/locale';
import type { CorrectionMode } from '@/domain/quiz';
import { useAuth } from '@/hooks/use-auth';
import { usePreferences } from '@/hooks/use-preferences';
import { GOAL_OPTIONS, useStudyGoal } from '@/hooks/use-study-goal';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

export default function SettingsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const {
    language,
    setLanguage,
    correctionMode,
    setCorrectionMode,
    showStudyCard,
    showReviewCard,
    showContinueCard,
    setShowCard,
  } = usePreferences();
  const { user, isAdmin, available, signIn, signUp, signOut } = useAuth();
  const { goalMinutes, setGoalMinutes } = useStudyGoal();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const correctionOptions: { value: CorrectionMode; label: string }[] = [
    { value: 'immediate', label: t('settings.correctionImmediate') },
    { value: 'end', label: t('settings.correctionEnd') },
  ];

  const handleAuth = async (mode: 'signIn' | 'signUp') => {
    if (!email.trim() || password.length < 6) {
      setAuthMessage(t('auth.errorFields'));
      return;
    }
    setSubmitting(true);
    setAuthMessage(null);
    const result = mode === 'signIn' ? await signIn(email, password) : await signUp(email, password);
    setSubmitting(false);
    if (result.error) {
      setAuthMessage(mode === 'signIn' ? t('auth.errorSignIn') : t('auth.errorSignUp'));
      return;
    }
    if (result.needsConfirmation) {
      setAuthMessage(t('auth.checkEmail'));
      return;
    }
    // Connexion réussie : l'état user est mis à jour par le provider.
    setEmail('');
    setPassword('');
    setAuthMessage(null);
  };

  const renderChip = (selected: boolean, label: string, onPress: () => void) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: selected ? '#0C5A44' : theme.backgroundElement },
        pressed && styles.pressed,
      ]}>
      <ThemedText type="smallBold" style={selected ? styles.chipSelected : undefined}>
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

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <ThemedText type="title" style={styles.title}>
            {t('settings.title')}
          </ThemedText>

          {available ? (
            <>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.section}>
                {t('settings.accountSection')}
              </ThemedText>
              {user ? (
                <>
                  <ThemedText>{t('auth.signedInAs', { email: user.email })}</ThemedText>
                  {isAdmin ? (
                    <Link href="/admin" asChild>
                      <Pressable
                        style={({ pressed }) => [
                          styles.secondaryButton,
                          { backgroundColor: theme.backgroundElement },
                          pressed && styles.pressed,
                        ]}>
                        <ThemedText type="smallBold">{t('admin.entry')}</ThemedText>
                      </Pressable>
                    </Link>
                  ) : null}
                  <Pressable
                    onPress={signOut}
                    style={({ pressed }) => [
                      styles.secondaryButton,
                      { backgroundColor: theme.backgroundElement },
                      pressed && styles.pressed,
                    ]}>
                    <ThemedText type="smallBold">{t('auth.signOut')}</ThemedText>
                  </Pressable>
                </>
              ) : (
                <>
                  <ThemedText themeColor="textSecondary" style={styles.authIntro}>
                    {t('auth.intro')}
                  </ThemedText>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder={t('auth.email')}
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
                  />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder={t('auth.password')}
                    placeholderTextColor={theme.textSecondary}
                    secureTextEntry
                    autoCapitalize="none"
                    style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
                  />
                  {authMessage ? (
                    <ThemedText type="small" themeColor="textSecondary">
                      {authMessage}
                    </ThemedText>
                  ) : null}
                  <View style={styles.authButtons}>
                    <Pressable
                      disabled={submitting}
                      onPress={() => handleAuth('signIn')}
                      style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                      <ThemedText style={styles.primaryLabel}>{t('auth.signIn')}</ThemedText>
                    </Pressable>
                    <Pressable
                      disabled={submitting}
                      onPress={() => handleAuth('signUp')}
                      style={({ pressed }) => [
                        styles.secondaryButton,
                        { backgroundColor: theme.backgroundElement },
                        pressed && styles.pressed,
                      ]}>
                      <ThemedText type="smallBold">{t('auth.signUp')}</ThemedText>
                    </Pressable>
                  </View>
                </>
              )}
            </>
          ) : null}

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.section}>
            {t('settings.languageSection')}
          </ThemedText>
          <View style={styles.row}>
            {LOCALES.map((option) =>
              renderChip(option.value === language, option.label, () => setLanguage(option.value)),
            )}
          </View>

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.section}>
            {t('settings.correctionSection')}
          </ThemedText>
          <View style={styles.rowWrap}>
            {correctionOptions.map((option) =>
              renderChip(option.value === correctionMode, option.label, () =>
                setCorrectionMode(option.value),
              ),
            )}
          </View>

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.section}>
            {t('settings.goalSection')}
          </ThemedText>
          <View style={styles.rowWrap}>
            {GOAL_OPTIONS.map((min) =>
              renderChip(min === goalMinutes, t('study.goalMinutes', { count: min }), () =>
                setGoalMinutes(min),
              ),
            )}
          </View>

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.section}>
            {t('settings.progressCardsSection')}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.authIntro}>
            {t('settings.progressCardsHint')}
          </ThemedText>
          <View style={styles.rowWrap}>
            {renderChip(showStudyCard, t('settings.cardStudy'), () =>
              setShowCard('study', !showStudyCard),
            )}
            {renderChip(showReviewCard, t('settings.cardReview'), () =>
              setShowCard('review', !showReviewCard),
            )}
            {renderChip(showContinueCard, t('settings.cardContinue'), () =>
              setShowCard('continue', !showContinueCard),
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
  authIntro: {
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    height: 44,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  authButtons: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#0C5A44',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  primaryLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
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
  chip: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.five,
  },
  chipSelected: {
    color: '#ffffff',
  },
  pressed: {
    opacity: 0.6,
  },
});
