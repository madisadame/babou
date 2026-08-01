import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { confirmAction, notify } from '@/lib/dialogs';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { contentRepository } from '@/data/content-repository';
import { pickAudio, uploadMedia } from '@/data/media';
import {
  createChapter,
  deleteChapter,
  deleteQuestion,
  deleteSegment,
  getQuestions,
  getSegments,
  updateChapter,
  type AdminQuestion,
  type AdminSegment,
} from '@/data/supabase/admin-repository';
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
  const [published, setPublished] = useState(true);
  const [audioUrl, setAudioUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [segments, setSegments] = useState<AdminSegment[]>([]);
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);

  const uploadChapterAudio = async () => {
    const picked = await pickAudio();
    if (!picked) return;
    setUploading(true);
    const { url, error } = await uploadMedia(picked, 'audio');
    setUploading(false);
    if (error || !url) {
      notify(t('admin.uploadError'));
      return;
    }
    setAudioUrl(url);
  };

  // Segments + questions : rechargés à chaque focus (après édition).
  useFocusEffect(
    useCallback(() => {
      if (!isNew) {
        getSegments(params.id).then(setSegments);
        getQuestions(params.id).then(setQuestions);
      }
    }, [params.id, isNew]),
  );

  const confirmDeleteSegment = (segment: AdminSegment) => {
    confirmAction({
      message: t('admin.deleteSegmentConfirm'),
      confirmLabel: t('admin.delete'),
      cancelLabel: t('common.cancel'),
      destructive: true,
      onConfirm: async () => {
        await deleteSegment(segment.id);
        getSegments(params.id).then(setSegments);
      },
    });
  };

  const confirmDeleteQuestion = (question: AdminQuestion) => {
    confirmAction({
      message: t('admin.deleteQuestionConfirm'),
      confirmLabel: t('admin.delete'),
      cancelLabel: t('common.cancel'),
      destructive: true,
      onConfirm: async () => {
        await deleteQuestion(question.id);
        getQuestions(params.id).then(setQuestions);
      },
    });
  };

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
      setPublished(chapter.published ?? true);
      setAudioUrl(chapter.audioUrl ?? '');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleSave = async () => {
    if (!title.trim()) {
      notify(t('admin.errorTitle'));
      return;
    }
    setSaving(true);
    const input = {
      bookId,
      title: title.trim(),
      description: description.trim(),
      position: Number(position) || 0,
      published,
      audioUrl: audioUrl.trim(),
    };
    const { error } = isNew ? await createChapter(input) : await updateChapter(params.id, input);
    setSaving(false);
    if (error) {
      notify(t('admin.errorSave'));
      return;
    }
    router.back();
  };

  const handleDelete = () => {
    confirmAction({
      title,
      message: t('admin.deleteChapterConfirm'),
      confirmLabel: t('admin.delete'),
      cancelLabel: t('common.cancel'),
      destructive: true,
      onConfirm: async () => {
        const { error } = await deleteChapter(params.id);
        if (error) notify(t('admin.errorSave'));
        else router.back();
      },
    });
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

          <View style={styles.field}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              {t('admin.statusLabel')}
            </ThemedText>
            <View style={styles.statusRow}>
              <Pressable
                onPress={() => setPublished(true)}
                style={[
                  styles.statusChip,
                  published ? styles.statusPublishedOn : { backgroundColor: theme.backgroundElement },
                ]}>
                <ThemedText type="smallBold" style={{ color: published ? '#ffffff' : theme.text }}>
                  {t('admin.statusPublished')}
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => setPublished(false)}
                style={[
                  styles.statusChip,
                  !published ? styles.statusDraftOn : { backgroundColor: theme.backgroundElement },
                ]}>
                <ThemedText type="smallBold" style={{ color: !published ? '#08301F' : theme.text }}>
                  {t('admin.statusDraft')}
                </ThemedText>
              </Pressable>
            </View>
          </View>

          {field(t('admin.fieldChapterAudio'), audioUrl, setAudioUrl)}
          <Pressable
            onPress={uploadChapterAudio}
            disabled={uploading}
            style={({ pressed }) => [
              styles.uploadButton,
              { backgroundColor: theme.backgroundElement },
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold">
              {uploading ? t('admin.uploading') : t('admin.uploadChapterAudio')}
            </ThemedText>
          </Pressable>

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
              <View style={styles.sectionHeader}>
                <ThemedText type="smallBold" themeColor="textSecondary" style={styles.section}>
                  {t('admin.lessonSection')}
                </ThemedText>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/admin/segment/[id]',
                      params: { id: 'new', chapterId: params.id },
                    })
                  }
                  hitSlop={Spacing.two}>
                  <ThemedText type="smallBold" themeColor="textSecondary">
                    + {t('admin.newSegment')}
                  </ThemedText>
                </Pressable>
              </View>

              {segments.length === 0 ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {t('admin.noSegments')}
                </ThemedText>
              ) : (
                segments.map((segment) => (
                  <ThemedView key={segment.id} type="backgroundElement" style={styles.segmentRow}>
                    <Pressable
                      onPress={() =>
                        router.push({ pathname: '/admin/segment/[id]', params: { id: segment.id } })
                      }
                      style={styles.segmentInfo}>
                      <ThemedText style={styles.segmentArabic} numberOfLines={1}>
                        {segment.arabic || '—'}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                        {segment.translationFr || '—'}
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => confirmDeleteSegment(segment)}
                      hitSlop={Spacing.two}
                      accessibilityLabel={t('admin.delete')}>
                      <ThemedText style={styles.deleteIcon}>🗑</ThemedText>
                    </Pressable>
                  </ThemedView>
                ))
              )}

              <View style={styles.sectionHeader}>
                <ThemedText type="smallBold" themeColor="textSecondary" style={styles.section}>
                  {t('admin.quizSection')}
                </ThemedText>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/admin/question/[id]',
                      params: { id: 'new', chapterId: params.id },
                    })
                  }
                  hitSlop={Spacing.two}>
                  <ThemedText type="smallBold" themeColor="textSecondary">
                    + {t('admin.newQuestion')}
                  </ThemedText>
                </Pressable>
              </View>

              {questions.length === 0 ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {t('admin.noQuestions')}
                </ThemedText>
              ) : (
                questions.map((question) => (
                  <ThemedView key={question.id} type="backgroundElement" style={styles.segmentRow}>
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/admin/question/[id]',
                          params: { id: question.id },
                        })
                      }
                      style={styles.segmentInfo}>
                      <ThemedText type="smallBold" numberOfLines={2}>
                        {question.promptFr || '—'}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {t('admin.choicesCount', { count: question.choices.length })}
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      onPress={() => confirmDeleteQuestion(question)}
                      hitSlop={Spacing.two}
                      accessibilityLabel={t('admin.delete')}>
                      <ThemedText style={styles.deleteIcon}>🗑</ThemedText>
                    </Pressable>
                  </ThemedView>
                ))
              )}

              <Pressable onPress={handleDelete} hitSlop={Spacing.two} style={styles.deleteChapter}>
                <ThemedText type="link" style={styles.deleteChapterLabel}>
                  {t('admin.deleteChapter')}
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
  statusRow: { flexDirection: 'row', gap: Spacing.two },
  statusChip: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.five,
  },
  statusPublishedOn: { backgroundColor: '#0C5A44' },
  statusDraftOn: { backgroundColor: '#E0BE6D' },
  input: {
    minHeight: 44,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
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
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  pressed: { opacity: 0.6 },
  section: { letterSpacing: 1 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.four,
  },
  segmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  segmentInfo: { flex: 1, gap: Spacing.half },
  segmentArabic: { fontSize: 18, textAlign: 'right', writingDirection: 'rtl' },
  deleteIcon: { fontSize: 18 },
  deleteChapter: { alignSelf: 'center', marginTop: Spacing.five },
  deleteChapterLabel: { color: '#e5484d' },
});

