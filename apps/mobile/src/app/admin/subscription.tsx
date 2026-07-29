import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import {
  fetchAppConfig,
  findUsers,
  setSubscriptionEnabled,
  setUserAccess,
  type FoundUser,
} from '@/data/supabase/access';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

// Panneau admin de l'abonnement : interrupteur global (active la semaine de
// grâce puis le blocage), et recherche d'un utilisateur pour lui offrir l'accès.
export default function AdminSubscriptionScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const { isAdmin } = useAuth();

  const [enabled, setEnabled] = useState(false);
  const [activatedAt, setActivatedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoundUser[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchAppConfig().then((c) => {
      setEnabled(c.subscriptionEnabled);
      setActivatedAt(c.activatedAt);
    });
  }, []);

  if (!isAdmin) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText themeColor="textSecondary">{t('admin.denied')}</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const toggleSubscription = async (value: boolean) => {
    setSaving(true);
    const { error } = await setSubscriptionEnabled(value);
    setSaving(false);
    if (error) {
      Alert.alert(t('admin.errorSave'));
      return;
    }
    setEnabled(value);
    const c = await fetchAppConfig();
    setActivatedAt(c.activatedAt);
  };

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setResults(await findUsers(query.trim()));
    setSearching(false);
  };

  const toggleAccess = async (u: FoundUser, value: boolean) => {
    const { error } = await setUserAccess(u.userId, value, 'admin');
    if (error) {
      Alert.alert(t('admin.errorSave'));
      return;
    }
    setResults((prev) =>
      prev.map((r) => (r.userId === u.userId ? { ...r, hasAccess: value } : r)),
    );
  };

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
            {t('admin.subTitle')}
          </ThemedText>

          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.rowBetween}>
              <View style={styles.flex}>
                <ThemedText type="smallBold">{t('admin.subEnable')}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
                  {t('admin.subEnableHint')}
                </ThemedText>
              </View>
              <Switch value={enabled} onValueChange={toggleSubscription} disabled={saving} />
            </View>
            {enabled && activatedAt ? (
              <ThemedText type="small" themeColor="textSecondary" style={styles.activated}>
                {t('admin.subActivatedOn')} {new Date(activatedAt).toLocaleDateString('fr-FR')}
              </ThemedText>
            ) : null}
          </ThemedView>

          <ThemedText type="smallBold" style={styles.sectionLabel}>
            {t('admin.subGrant')}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
            {t('admin.subGrantHint')}
          </ThemedText>

          <View style={styles.searchRow}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={search}
              placeholder={t('admin.subSearchPlaceholder')}
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="none"
              keyboardType="email-address"
              style={[styles.input, { color: theme.text, borderColor: 'rgba(245,238,218,0.25)' }]}
            />
            <Pressable
              onPress={search}
              style={({ pressed }) => [styles.searchBtn, pressed && styles.pressed]}>
              <ThemedText type="smallBold" style={styles.searchBtnLabel}>
                {t('admin.subSearch')}
              </ThemedText>
            </Pressable>
          </View>

          {searching ? (
            <ThemedText type="small" themeColor="textSecondary">
              {t('common.loading')}
            </ThemedText>
          ) : (
            results.map((u) => (
              <ThemedView key={u.userId} type="backgroundElement" style={styles.userRow}>
                <View style={styles.flex}>
                  <ThemedText type="smallBold">{u.email}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                  </ThemedText>
                </View>
                <Switch value={u.hasAccess} onValueChange={(v) => toggleAccess(u, v)} />
              </ThemedView>
            ))
          )}
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
  title: { fontSize: 28, marginBottom: Spacing.two },
  card: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  flex: { flex: 1 },
  hint: { lineHeight: 18, marginTop: 2 },
  activated: { marginTop: Spacing.one },
  sectionLabel: { marginTop: Spacing.four },
  searchRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.one },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 15,
  },
  searchBtn: {
    backgroundColor: '#F5EEDA',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    justifyContent: 'center',
  },
  searchBtnLabel: { color: '#0C5A44' },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    marginTop: Spacing.one,
    gap: Spacing.two,
  },
  pressed: { opacity: 0.8 },
});
