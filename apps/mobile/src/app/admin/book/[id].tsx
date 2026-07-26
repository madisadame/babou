import { Link, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Chapter } from '@/domain/chapter';
import { contentRepository } from '@/data/content-repository';
import { pickImage, uploadMedia } from '@/data/media';
import { createBook, deleteBook, deleteChapter, updateBook } from '@/data/supabase/admin-repository';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

export default function AdminBookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const isNew = id === 'new';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [position, setPosition] = useState('0');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleUploadCover = async () => {
    const picked = await pickImage();
    if (!picked) return;
    setUploading(true);
    const { url, error } = await uploadMedia(picked, 'covers');
    setUploading(false);
    if (error || !url) {
      Alert.alert(t('admin.uploadError'));
      return;
    }
    setCoverUrl(url);
  };

  // Champs du livre : chargés une fois (ne pas écraser les saisies au focus).
  useEffect(() => {
    (async () => {
      if (isNew) {
        const books = await contentRepository.getBooks();
        setPosition(String(books.length + 1));
        return;
      }
      const book = await contentRepository.getBook(id);
      if (!book) return;
      setTitle(book.title);
      setDescription(book.description);
      setCategory(book.category);
      setCoverUrl(book.coverUrl ?? '');
      setPosition(String(book.position));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Chapitres : rechargés à chaque focus (après édition d'un chapitre).
  useFocusEffect(
    useCallback(() => {
      if (!isNew) contentRepository.getChapters(id).then(setChapters);
    }, [id, isNew]),
  );

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(t('admin.errorTitle'));
      return;
    }
    setSaving(true);
    const input = {
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      coverUrl: coverUrl.trim(),
      position: Number(position) || 0,
    };
    const { error } = isNew ? await createBook(input) : await updateBook(id, input);
    setSaving(false);
    if (error) {
      Alert.alert(t('admin.errorSave'));
      return;
    }
    router.back();
  };

  const handleDelete = () => {
    Alert.alert(title, t('admin.deleteBookConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('admin.delete'),
        style: 'destructive',
        onPress: async () => {
          const { error } = await deleteBook(id);
          if (error) Alert.alert(t('admin.errorSave'));
          else router.back();
        },
      },
    ]);
  };

  const confirmDeleteChapter = (chapter: Chapter) => {
    Alert.alert(chapter.title, t('admin.deleteChapterConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('admin.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteChapter(chapter.id);
          contentRepository.getChapters(id).then(setChapters);
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
            {isNew ? t('admin.newBookTitle') : t('admin.editBookTitle')}
          </ThemedText>

          {field(t('admin.fieldTitle'), title, setTitle)}
          {field(t('admin.fieldDescription'), description, setDescription, { multiline: true })}
          {field(t('admin.fieldCategory'), category, setCategory)}
          {field(t('admin.fieldCoverUrl'), coverUrl, setCoverUrl)}
          <Pressable
            onPress={handleUploadCover}
            disabled={uploading}
            style={({ pressed }) => [
              styles.uploadButton,
              { backgroundColor: theme.backgroundElement },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold">
              {uploading ? t('admin.uploading') : t('admin.uploadImage')}
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
              <View style={styles.chaptersHeader}>
                <ThemedText type="smallBold" themeColor="textSecondary" style={styles.section}>
                  {t('admin.chaptersSection')}
                </ThemedText>
                <Link href={{ pathname: '/admin/chapter/[id]', params: { id: 'new', bookId: id } }} asChild>
                  <Pressable hitSlop={Spacing.two}>
                    <ThemedText type="smallBold" themeColor="textSecondary">
                      + {t('admin.newChapter')}
                    </ThemedText>
                  </Pressable>
                </Link>
              </View>

              {chapters.length === 0 ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {t('admin.noChapters')}
                </ThemedText>
              ) : (
                chapters.map((chapter) => (
                  <ThemedView key={chapter.id} type="backgroundElement" style={styles.chapterRow}>
                    <Link
                      href={{ pathname: '/admin/chapter/[id]', params: { id: chapter.id } }}
                      asChild>
                      <Pressable style={styles.chapterInfo}>
                        <ThemedText type="smallBold">
                          {chapter.order}. {chapter.title}
                        </ThemedText>
                      </Pressable>
                    </Link>
                    <Pressable
                      onPress={() => confirmDeleteChapter(chapter)}
                      hitSlop={Spacing.two}
                      accessibilityLabel={t('admin.delete')}>
                      <ThemedText style={styles.deleteIcon}>🗑</ThemedText>
                    </Pressable>
                  </ThemedView>
                ))
              )}

              <Pressable onPress={handleDelete} hitSlop={Spacing.two} style={styles.deleteBook}>
                <ThemedText type="link" style={styles.deleteBookLabel}>
                  {t('admin.deleteBook')}
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
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  primaryButton: {
    backgroundColor: '#3c87f7',
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
  section: { letterSpacing: 1 },
  chaptersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.four,
  },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  chapterInfo: { flex: 1 },
  deleteIcon: { fontSize: 18 },
  pressed: { opacity: 0.6 },
  deleteBook: { alignSelf: 'center', marginTop: Spacing.five },
  deleteBookLabel: { color: '#e5484d' },
});
