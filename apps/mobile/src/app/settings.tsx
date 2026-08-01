import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { confirmAction } from '@/lib/dialogs';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { LOCALES } from '@/domain/locale';
import type { CorrectionMode } from '@/domain/quiz';
import { useAuth } from '@/hooks/use-auth';
import { PLAYBACK_RATES, READING_SCALES, usePreferences } from '@/hooks/use-preferences';
import { useProfile } from '@/hooks/use-profile';
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
    readingScale,
    setReadingScale,
    playbackRate,
    setPlaybackRate,
  } = usePreferences();
  const sizeLabels = [
    t('reading.sizeSmall'),
    t('reading.sizeNormal'),
    t('reading.sizeLarge'),
    t('reading.sizeXLarge'),
  ];
  const {
    user,
    isAdmin,
    available,
    recovering,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    deleteAccount,
  } = useAuth();
  const { goalMinutes, setGoalMinutes } = useStudyGoal();
  const { name, avatar } = useProfile();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleForgot = async () => {
    if (!email.trim()) {
      setAuthMessage(t('auth.resetNeedEmail'));
      return;
    }
    const { error } = await resetPassword(email);
    setAuthMessage(error ? t('auth.resetError') : t('auth.resetSent'));
  };

  const handleDeleteAccount = () => {
    confirmAction({
      title: t('auth.deleteTitle'),
      message: t('auth.deleteMessage'),
      confirmLabel: t('auth.deleteConfirm'),
      cancelLabel: t('common.cancel'),
      destructive: true,
      onConfirm: async () => {
        const { error } = await deleteAccount();
        if (error) setAuthMessage(t('auth.deleteError'));
      },
    });
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      setAuthMessage(t('auth.errorFields'));
      return;
    }
    const { error } = await updatePassword(newPassword);
    setNewPassword('');
    setAuthMessage(error ? t('auth.resetError') : t('auth.passwordUpdated'));
  };

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

          <Pressable
            onPress={() => router.push('/profile')}
            style={({ pressed }) => (pressed ? styles.pressed : undefined)}>
            <ThemedView type="backgroundElement" style={styles.profileRow}>
              <ThemedText style={styles.profileAvatar}>{avatar}</ThemedText>
              <View style={styles.profileText}>
                <ThemedText type="smallBold">{name || t('profile.title')}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('profile.open')}
                </ThemedText>
              </View>
              <ThemedText style={styles.profileChevron}>›</ThemedText>
            </ThemedView>
          </Pressable>

          <Pressable
            onPress={() => router.push('/support')}
            hitSlop={Spacing.two}
            style={styles.supportLink}>
            <ThemedText type="smallBold" style={styles.supportLinkText}>
              🤲 {t('support.title')}
            </ThemedText>
          </Pressable>

          {recovering ? (
            <View style={styles.recoverBox}>
              <ThemedText type="smallBold">{t('auth.newPasswordSection')}</ThemedText>
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder={t('auth.newPassword')}
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                autoCapitalize="none"
                style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
              />
              <Pressable
                onPress={handleUpdatePassword}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                <ThemedText style={styles.primaryLabel}>{t('auth.updatePassword')}</ThemedText>
              </Pressable>
            </View>
          ) : null}

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
                  <Pressable
                    onPress={handleDeleteAccount}
                    hitSlop={Spacing.two}
                    style={styles.deleteAccount}>
                    <ThemedText type="small" style={styles.deleteAccountText}>
                      {t('auth.deleteTitle')}
                    </ThemedText>
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
                  <Pressable onPress={handleForgot} hitSlop={Spacing.two} style={styles.forgot}>
                    <ThemedText type="link" themeColor="textSecondary">
                      {t('auth.forgot')}
                    </ThemedText>
                  </Pressable>
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
            {t('settings.textSizeSection')}
          </ThemedText>
          <View style={styles.rowWrap}>
            {READING_SCALES.map((scale, i) =>
              renderChip(readingScale === scale, sizeLabels[i], () => setReadingScale(scale)),
            )}
          </View>

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.section}>
            {t('settings.playbackRateSection')}
          </ThemedText>
          <View style={styles.rowWrap}>
            {PLAYBACK_RATES.map((rate) =>
              renderChip(
                playbackRate === rate,
                `${rate === 1 ? '1' : String(rate).replace('.', ',')}×`,
                () => setPlaybackRate(rate),
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
    // Bordure subtile : garantit que le champ reste perceptible quel que soit
    // le fond (utile notamment sur le web).
    borderWidth: 1,
    borderColor: 'rgba(245, 238, 218, 0.18)',
  },
  authButtons: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  forgot: {
    alignSelf: 'flex-start',
    marginTop: Spacing.one,
  },
  supportLink: { alignSelf: 'flex-start', marginTop: Spacing.one },
  supportLinkText: { color: '#E0BE6D' },
  deleteAccount: { alignSelf: 'center', marginTop: Spacing.two },
  deleteAccountText: { color: '#e5484d' },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    marginTop: Spacing.two,
  },
  profileAvatar: { fontSize: 30 },
  profileText: { flex: 1, gap: 2 },
  profileChevron: { color: 'rgba(245, 238, 218, 0.6)', fontSize: 26 },
  recoverBox: {
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(224, 190, 109, 0.4)',
    borderRadius: Spacing.three,
    padding: Spacing.four,
    marginTop: Spacing.two,
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
