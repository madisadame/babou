import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { pickAudio, uploadMedia } from '@/data/media';
import {
  createSegment,
  deleteSegment,
  getSegment,
  getSegments,
  updateSegment,
} from '@/data/supabase/admin-repository';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

export default function AdminSegmentScreen() {
  const params = useLocalSearchParams<{ id: string; chapterId?: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const isNew = params.id === 'new';

  const [chapterId, setChapterId] = useState(params.chapterId ?? '');
  const [arabic, setArabic] = useState('');
  const [translationFr, setTranslationFr] = useState('');
  const [translationShimaore, setTranslationShimaore] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [position, setPosition] = useState('0');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

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

  useEffect(() => {
    (async () => {
      if (isNew) {
        if (params.chapterId) {
          const segments = await getSegments(params.chapterId);
          setPosition(String(segments.length + 1));
        }
        return;
      }
      const segment = await getSegment(params.id);
      if (!segment) return;
      setChapterId(segment.chapterId);
      setArabic(segment.arabic);
      setTranslationFr(segment.translationFr);
      setTranslationShimaore(segment.translationShimaore);
      setAudioUrl(segment.audioUrl);
      setPosition(String(segment.position));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleSave = async () => {
    if (!arabic.trim() && !translationFr.trim()) {
      Alert.alert(t('admin.errorSegmentEmpty'));
      return;
    }
    setSaving(true);
    const input = {
      chapterId,
      position: Number(position) || 0,
      arabic: arabic.trim(),
      translationFr: translationFr.trim(),
      translationShimaore: translationShimaore.trim(),
      audioUrl: audioUrl.trim(),
    };
    const { error } = isNew ? await createSegment(input) : await updateSegment(params.id, input);
    setSaving(false);
    if (error) {
      Alert.alert(t('admin.errorSave'));
      return;
    }
    router.back();
  };

  const handleDelete = () => {
    Alert.alert('', t('admin.deleteSegmentConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('admin.delete'),
        style: 'destructive',
        onPress: async () => {
          const { error } = await deleteSegment(params.id);
          if (error) Alert.alert(t('admin.errorSave'));
          else router.back();
        },
      },
    ]);
  };

  const field = (
    label: string,
    value: string,
    onChangeText: (v: string) => void,
    options?: { multiline?: boolean; numeric?: boolean; rtl?: boolean },
  ) => (
    <View style={styles.field}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {label}
      </ThemedText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={options?.multiline}
        keyboardType={options?.numeric ? 'number-pad' : 'default'}
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          options?.multiline && styles.inputMultiline,
          options?.rtl && styles.inputRtl,
          { backgroundColor: theme.backgroundElement, color: theme.text },
        ]}
      />
    </View>
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
            {isNew ? t('admin.newSegmentTitle') : t('admin.editSegmentTitle')}
          </ThemedText>

          {field(t('admin.fieldArabic'), arabic, setArabic, { multiline: true, rtl: true })}
          {field(t('admin.fieldTranslationFr'), translationFr, setTranslationFr, { multiline: true })}
          {field(t('admin.fieldTranslationShimaore'), translationShimaore, setTranslationShimaore, {
            multiline: true,
          })}
          {field(t('admin.fieldAudioUrl'), audioUrl, setAudioUrl)}
          <Pressable
            onPress={handleUploadAudio}
            disabled={uploading}
            style={({ pressed }) => [
              styles.uploadButton,
              { backgroundColor: theme.backgroundElement },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold">
              {uploading ? t('admin.uploading') : t('admin.uploadAudio')}
            </ThemedText>
          </Pressable>
          {field(t('admin.fieldPosition'), position, setPosition, { numeric: true })}

          <Pressable
            disabled={saving}
            onPress={handleSave}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <ThemedText style={styles.primaryLabel}>
              {isNew ? t('admin.create') : t('admin.save')}
            </ThemedText>
          </Pressable>

          {!isNew ? (
            <>
              {audioUrl.trim() ? (
                <Pressable
                  onPress={() =>
                    router.push({ pathname: '/admin/timings/[id]', params: { id: params.id } })
                  }
                  style={({ pressed }) => [
                    styles.timingsButton,
                    { backgroundColor: theme.backgroundElement },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText type="smallBold">{t('admin.editTimings')}</ThemedText>
                </Pressable>
              ) : null}
              <Pressable onPress={handleDelete} hitSlop={Spacing.two} style={styles.deleteRow}>
                <ThemedText type="link" style={styles.deleteLabel}>
                  {t('admin.deleteSegment')}
                </ThemedText>
              </Pressable>
            </>
          ) : null}
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
  title: { fontSize: 30, lineHeight: 36, marginBottom: Spacing.two },
  field: { gap: Spacing.one },
  input: {
    minHeight: 44,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  inputMultiline: { minHeight: 72, textAlignVertical: 'top' },
  inputRtl: { textAlign: 'right', writingDirection: 'rtl', fontSize: 22, lineHeight: 36 },
  primaryButton: {
    backgroundColor: '#0C5A44',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  primaryLabel: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  uploadButton: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  timingsButton: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  pressed: { opacity: 0.6 },
  deleteRow: { alignSelf: 'center', marginTop: Spacing.four },
  deleteLabel: { color: '#e5484d' },
});
