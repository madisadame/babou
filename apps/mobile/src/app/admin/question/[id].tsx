import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import {
  createQuestion,
  deleteQuestion,
  getQuestion,
  getQuestions,
  updateQuestion,
  type AdminChoiceInput,
} from '@/data/supabase/admin-repository';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

const emptyChoice = (): AdminChoiceInput => ({ textFr: '', textShimaore: '' });

export default function AdminQuestionScreen() {
  const params = useLocalSearchParams<{ id: string; chapterId?: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const isNew = params.id === 'new';

  const [chapterId, setChapterId] = useState(params.chapterId ?? '');
  const [promptFr, setPromptFr] = useState('');
  const [promptShimaore, setPromptShimaore] = useState('');
  const [explanationFr, setExplanationFr] = useState('');
  const [explanationShimaore, setExplanationShimaore] = useState('');
  const [position, setPosition] = useState('0');
  const [choices, setChoices] = useState<AdminChoiceInput[]>([emptyChoice(), emptyChoice()]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (isNew) {
        if (params.chapterId) {
          const questions = await getQuestions(params.chapterId);
          setPosition(String(questions.length + 1));
        }
        return;
      }
      const question = await getQuestion(params.id);
      if (!question) return;
      setChapterId(question.chapterId);
      setPromptFr(question.promptFr);
      setPromptShimaore(question.promptShimaore);
      setExplanationFr(question.explanationFr);
      setExplanationShimaore(question.explanationShimaore);
      setPosition(String(question.position));
      setChoices(question.choices.length ? question.choices : [emptyChoice(), emptyChoice()]);
      setCorrectIndex(question.correctIndex);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const setChoiceField = (index: number, field: keyof AdminChoiceInput, value: string) => {
    setChoices((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const addChoice = () => setChoices((prev) => [...prev, emptyChoice()]);

  const removeChoice = (index: number) => {
    setChoices((prev) => prev.filter((_, i) => i !== index));
    setCorrectIndex((prev) => {
      if (index === prev) return 0;
      return index < prev ? prev - 1 : prev;
    });
  };

  const handleSave = async () => {
    const filledChoices = choices.filter((c) => c.textFr.trim() || c.textShimaore.trim());
    if (!promptFr.trim() || filledChoices.length < 2 || correctIndex >= filledChoices.length) {
      Alert.alert(t('admin.errorQuestion'));
      return;
    }
    setSaving(true);
    const input = {
      chapterId,
      position: Number(position) || 0,
      promptFr: promptFr.trim(),
      promptShimaore: promptShimaore.trim(),
      explanationFr: explanationFr.trim(),
      explanationShimaore: explanationShimaore.trim(),
      correctIndex,
      choices: filledChoices.map((c) => ({ textFr: c.textFr.trim(), textShimaore: c.textShimaore.trim() })),
    };
    const { error } = isNew ? await createQuestion(input) : await updateQuestion(params.id, input);
    setSaving(false);
    if (error) {
      Alert.alert(t('admin.errorSave'));
      return;
    }
    router.back();
  };

  const handleDelete = () => {
    Alert.alert('', t('admin.deleteQuestionConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('admin.delete'),
        style: 'destructive',
        onPress: async () => {
          const { error } = await deleteQuestion(params.id);
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
            {isNew ? t('admin.newQuestionTitle') : t('admin.editQuestionTitle')}
          </ThemedText>

          {field(t('admin.fieldPromptFr'), promptFr, setPromptFr, { multiline: true })}
          {field(t('admin.fieldPromptShimaore'), promptShimaore, setPromptShimaore, { multiline: true })}

          <View style={styles.sectionHeader}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.section}>
              {t('admin.choicesSection')}
            </ThemedText>
            <Pressable onPress={addChoice} hitSlop={Spacing.two}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                + {t('admin.addChoice')}
              </ThemedText>
            </Pressable>
          </View>

          {choices.map((choice, index) => (
            <ThemedView key={index} type="backgroundElement" style={styles.choiceCard}>
              <View style={styles.choiceHeader}>
                <Pressable
                  onPress={() => setCorrectIndex(index)}
                  hitSlop={Spacing.two}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: correctIndex === index }}
                  style={styles.correctToggle}>
                  <ThemedText style={correctIndex === index ? styles.correctOn : styles.correctOff}>
                    {correctIndex === index ? '◉' : '○'}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {t('admin.correctAnswer')}
                  </ThemedText>
                </Pressable>
                {choices.length > 2 ? (
                  <Pressable
                    onPress={() => removeChoice(index)}
                    hitSlop={Spacing.two}
                    accessibilityLabel={t('admin.delete')}>
                    <ThemedText style={styles.deleteIcon}>🗑</ThemedText>
                  </Pressable>
                ) : null}
              </View>
              <TextInput
                value={choice.textFr}
                onChangeText={(v) => setChoiceField(index, 'textFr', v)}
                placeholder={t('admin.choiceFr')}
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
              />
              <TextInput
                value={choice.textShimaore}
                onChangeText={(v) => setChoiceField(index, 'textShimaore', v)}
                placeholder={t('admin.choiceShimaore')}
                placeholderTextColor={theme.textSecondary}
                style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
              />
            </ThemedView>
          ))}

          {field(t('admin.fieldExplanationFr'), explanationFr, setExplanationFr, { multiline: true })}
          {field(t('admin.fieldExplanationShimaore'), explanationShimaore, setExplanationShimaore, {
            multiline: true,
          })}
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
            <Pressable onPress={handleDelete} hitSlop={Spacing.two} style={styles.deleteRow}>
              <ThemedText type="link" style={styles.deleteLabel}>
                {t('admin.deleteQuestion')}
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
  inputMultiline: { minHeight: 60, textAlignVertical: 'top' },
  section: { letterSpacing: 1 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.three,
  },
  choiceCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  choiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  correctToggle: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  correctOn: { color: '#2e9e5b', fontSize: 18 },
  correctOff: { color: '#8a8f98', fontSize: 18 },
  deleteIcon: { fontSize: 18 },
  primaryButton: {
    backgroundColor: '#0C5A44',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  primaryLabel: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  pressed: { opacity: 0.6 },
  deleteRow: { alignSelf: 'center', marginTop: Spacing.five },
  deleteLabel: { color: '#e5484d' },
});
