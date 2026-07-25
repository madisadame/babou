import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { contentRepository } from '@/data/content-repository';
import { createChapter, deleteChapter, updateChapter } from '@/data/supabase/admin-repository';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

export default function AdminChapterScreen() {
  const params = useLocalSearchParams<{ id: string; bookId?: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const isNew = params.id === 'new';

  const [bookId, setBookId] = useState(params.bookId ?? '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [position, setPosition] = useState('0');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (isNew) {
        if (params.bookId) {
          const chapters = await contentRepository.getChapters(params.bookId);
          setPosition(String(chapters.length + 1));
        }
        return;
      }
      const chapter = await contentRepository.getChapter(params.id);
      if (!chapter) return;
      setBookId(chapter.bookId);
      setTitle(chapter.title);
      setDescription(chapter.description);
      setPosition(String(chapter.order));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(t('admin.errorTitle'));
      return;
    }
    setSaving(true);
    const input = {
      bookId,
      title: title.trim(),
      description: description.trim(),
      position: Number(position) || 0,
    };
    const { error } = isNew ? await createChapter(input) : await updateChapter(params.id, input);
    setSaving(false);
    if (error) {
      Alert.alert(t('admin.errorSave'));
      return;
    }
    router.back();
  };

  const handleDelete = () => {
    Alert.alert(title, t('admin.deleteChapterConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('admin.delete'),
        style: 'destructive',
        onPress: async () => {
          const { error } = await deleteChapter(params.id);
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
    options?: { multiline?: boolean; numeric?: boolean },
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
            {isNew ? t('admin.newChapterTitle') : t('admin.editChapterTitle')}
          </ThemedText>

          {field(t('admin.fieldTitle'), title, setTitle)}
          {field(t('admin.fieldDescription'), description, setDescription, { multiline: true })}
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
            <Pressable onPress={handleDelete} hitSlop={Spacing.two} style={styles.deleteChapter}>
              <ThemedText type="link" style={styles.deleteChapterLabel}>
                {t('admin.deleteChapter')}
              </ThemedText>
            </Pressable>
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
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  primaryButton: {
    backgroundColor: '#3c87f7',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  primaryLabel: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  pressed: { opacity: 0.6 },
  deleteChapter: { alignSelf: 'center', marginTop: Spacing.five },
  deleteChapterLabel: { color: '#e5484d' },
});
