import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { pickAudio, uploadMedia } from '@/data/media';
import { upsertSiteContent } from '@/data/supabase/admin-repository';
import { fetchSiteContent } from '@/data/supabase/site-content';

const AUDIO_KEY = 'home.audioUrl';
import type { TranslationKey } from '@/i18n';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

// Champs éditables de la page d'accueil.
const FIELDS: { key: TranslationKey; label: string; multiline: boolean }[] = [
  { key: 'home.title', label: 'Titre', multiline: false },
  { key: 'home.intro.p1', label: 'Paragraphe 1', multiline: true },
  { key: 'home.intro.p2', label: 'Paragraphe 2', multiline: true },
  { key: 'home.intro.p3', label: 'Paragraphe 3', multiline: true },
  { key: 'home.intro.p4', label: 'Paragraphe 4', multiline: true },
  { key: 'home.invocation', label: 'Invocation (bas de page)', multiline: true },
  { key: 'home.cta', label: 'Texte du bouton', multiline: false },
];

// Éditeur de la page d'accueil : modifie les textes (repli sur le texte par
// défaut si un champ est vidé).
export default function AdminHomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [values, setValues] = useState<Record<string, string>>({});
  const [audioUrl, setAudioUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const overrides = await fetchSiteContent();
      const initial: Record<string, string> = {};
      for (const f of FIELDS) initial[f.key] = overrides[f.key] ?? t(f.key);
      setValues(initial);
      setAudioUrl(overrides[AUDIO_KEY] ?? '');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUploadAudio = async () => {
    const picked = await pickAudio();
    if (!picked) return;
    setUploading(true);
    const { url, error } = await uploadMedia(picked, 'audio');
    setUploading(false);
    if (error || !url) {
      Alert.alert(t('admin.uploadError'));
      return;
    }
    setAudioUrl(url);
  };

  const handleSave = async () => {
    setSaving(true);
    let failed = false;
    for (const f of FIELDS) {
      const { error } = await upsertSiteContent(f.key, (values[f.key] ?? '').trim());
      if (error) failed = true;
    }
    const audioRes = await upsertSiteContent(AUDIO_KEY, audioUrl.trim());
    if (audioRes.error) failed = true;
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
              {t('admin.homeTitle')}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {t('admin.homeHint')}
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
                  placeholderTextColor={theme.textSecondary}
                  style={[
                    styles.input,
                    f.multiline && styles.inputMultiline,
                    { backgroundColor: theme.backgroundElement, color: theme.text },
                  ]}
                />
              </View>
            ))}

            <View style={styles.field}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                {t('admin.homeAudioLabel')}
              </ThemedText>
              {audioUrl ? (
                <View style={styles.audioRow}>
                  <ThemedText type="small" style={styles.audioSet}>
                    ✓ {t('admin.homeAudioSet')}
                  </ThemedText>
                  <Pressable onPress={() => setAudioUrl('')} hitSlop={Spacing.two}>
                    <ThemedText type="small" style={styles.audioRemove}>
                      {t('admin.homeAudioRemove')}
                    </ThemedText>
                  </Pressable>
                </View>
              ) : null}
              <Pressable
                onPress={handleUploadAudio}
                disabled={uploading}
                style={({ pressed }) => [
                  styles.uploadButton,
                  { backgroundColor: theme.backgroundElement },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold">
                  {uploading ? t('admin.uploading') : t('admin.homeAudioUpload')}
                </ThemedText>
              </Pressable>
            </View>

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
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  audioSet: { color: '#7fd3af' },
  audioRemove: { color: '#e5484d' },
  uploadButton: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
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
