import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { AVATARS, useProfile } from '@/hooks/use-profile';
import { useReadingProgress } from '@/hooks/use-reading-progress';
import { useReview } from '@/hooks/use-review';
import { useStudyGoal } from '@/hooks/use-study-goal';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

function Stat({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <ThemedView type="backgroundElement" style={styles.stat}>
      <ThemedText style={styles.statIcon}>{icon}</ThemedText>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>
        {label}
      </ThemedText>
    </ThemedView>
  );
}

// Profil utilisateur : avatar (emoji), pseudo, et résumé de progression.
// Synchronisé entre appareils quand on est connecté.
export default function ProfileScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { name, avatar, setName, setAvatar } = useProfile();
  const { streak, bestStreak } = useStudyGoal();
  const { bookmarks } = useBookmarks();
  const { getDueItems } = useReview();
  const { completedCount } = useReadingProgress();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()} hitSlop={Spacing.three} style={styles.back}>
          <ThemedText type="link" themeColor="textSecondary">
            ← {t('common.back')}
          </ThemedText>
        </Pressable>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.avatarBig}>
            <ThemedText style={styles.avatarBigEmoji}>{avatar}</ThemedText>
          </View>

          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('profile.namePlaceholder')}
            placeholderTextColor={theme.textSecondary}
            style={[styles.nameInput, { backgroundColor: theme.backgroundElement, color: theme.text }]}
            maxLength={30}
          />

          <ThemedText type="small" themeColor="textSecondary" style={styles.subline}>
            {user ? user.email : t('profile.guestNote')}
          </ThemedText>

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.section}>
            {t('profile.avatarSection')}
          </ThemedText>
          <View style={styles.avatarGrid}>
            {AVATARS.map((a) => {
              const selected = a === avatar;
              return (
                <Pressable
                  key={a}
                  onPress={() => setAvatar(a)}
                  accessibilityRole="button"
                  style={[
                    styles.avatarCell,
                    { backgroundColor: theme.backgroundElement },
                    selected && styles.avatarCellOn,
                  ]}>
                  <ThemedText style={styles.avatarCellEmoji}>{a}</ThemedText>
                </Pressable>
              );
            })}
          </View>

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.section}>
            {t('profile.statsSection')}
          </ThemedText>
          <View style={styles.statsGrid}>
            <Stat icon="🔥" value={streak} label={t('profile.streak')} />
            <Stat icon="🏆" value={bestStreak} label={t('profile.record')} />
            <Stat icon="📖" value={completedCount} label={t('profile.chaptersRead')} />
            <Stat icon="🔖" value={bookmarks.length} label={t('profile.bookmarks')} />
            <Stat icon="📝" value={getDueItems().length} label={t('profile.toReview')} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.four },
  back: { marginBottom: Spacing.three },
  content: { paddingBottom: Spacing.six, gap: Spacing.two },
  avatarBig: {
    alignSelf: 'center',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: 'rgba(245, 238, 218, 0.25)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBigEmoji: { fontSize: 52 },
  nameInput: {
    height: 48,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: Spacing.two,
  },
  subline: { textAlign: 'center' },
  section: { marginTop: Spacing.three, letterSpacing: 1 },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  avatarCell: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarCellOn: { borderColor: '#E0BE6D' },
  avatarCellEmoji: { fontSize: 26 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  stat: {
    flexGrow: 1,
    flexBasis: '30%',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    gap: 2,
  },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 22, fontWeight: '700', color: '#F5EEDA', fontVariant: ['tabular-nums'] },
  statLabel: { textAlign: 'center' },
});
