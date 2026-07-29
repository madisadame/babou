import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { upsertSiteContent } from '@/data/supabase/admin-repository';
import { fetchSiteContent } from '@/data/supabase/site-content';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

const FIELDS: { key: string; label: string; multiline: boolean; url?: boolean }[] = [
  { key: 'support.intro', label: 'Message d’introduction', multiline: true },
  { key: 'support.donateUrl', label: 'Lien — don ponctuel (URL)', multiline: false, url: true },
  { key: 'support.monthlyUrl', label: 'Lien — soutien mensuel (URL)', multiline: false, url: true },
  { key: 'support.yearlyUrl', label: 'Lien — soutien annuel (URL)', multiline: false, url: true },
];

// Éditeur admin des liens de soutien (don / abonnement). Colle les URLs de ta
// plateforme (HelloAsso, Stripe, PayPal…). Un champ vide masque le bouton.
export default function AdminSupportScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const overrides = await fetchSiteContent();
      const initial: Record<string, string> = {};
      for (const f of FIELDS) {
        initial[f.key] = overrides[f.key] ?? (f.key === 'support.intro' ? t('support.intro') : '');
      }
      setValues(initial);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setSaving(true);
    let failed = false;
    for (const f of FIELDS) {
      const { error } = await upsertSiteContent(f.key, (values[f.key] ?? '').trim());
      if (error) failed = true;
    }
    setSaving(false);
    if (failed) {
      Alert.alert(t('admin.errorSave'));
      return;
    }
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()} hitSlop={Spacing.three} style={styles.back}>
          <ThemedText type="link" themeColor="textSecondary">
            ← {t('common.back')}
          </ThemedText>
        </Pressable>

        {!isAdmin ? (
          <ThemedText themeColor="textSecondary" style={styles.centered}>
            {t('admin.denied')}
          </ThemedText>
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            <ThemedText type="title" style={styles.title}>
              {t('admin.supportTitle')}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {t('admin.supportHint')}
            </ThemedText>

            {FIELDS.map((f) => (
              <View key={f.key} style={styles.field}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  {f.label}
                </ThemedText>
                <TextInput
                  value={values[f.key] ?? ''}
                  onChangeText={(v) => setValues((prev) => ({ ...prev, [f.key]: v }))}
                  multiline={f.multiline}
                  autoCapitalize={f.url ? 'none' : 'sentences'}
                  autoCorrect={!f.url}
                  keyboardType={f.url ? 'url' : 'default'}
                  placeholder={f.url ? 'https://…' : ''}
                  placeholderTextColor={theme.textSecondary}
                  style={[
                    styles.input,
                    f.multiline && styles.inputMultiline,
                    { backgroundColor: theme.backgroundElement, color: theme.text },
                  ]}
                />
              </View>
            ))}

            <Pressable
              disabled={saving}
              onPress={handleSave}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
              <ThemedText style={styles.primaryLabel}>{t('admin.save')}</ThemedText>
            </Pressable>
          </ScrollView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.four },
  back: { marginBottom: Spacing.three },
  content: { paddingBottom: Spacing.six, gap: Spacing.two },
  title: { fontSize: 30, lineHeight: 36 },
  field: { gap: Spacing.one, marginTop: Spacing.two },
  input: {
    minHeight: 44,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  inputMultiline: { minHeight: 96, textAlignVertical: 'top' },
  primaryButton: {
    backgroundColor: '#0C5A44',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  primaryLabel: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  centered: { textAlign: 'center', marginTop: Spacing.five },
  pressed: { opacity: 0.6 },
});
