import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { getSegment, updateSegmentWords, type WordTiming } from '@/data/supabase/admin-repository';
import { useTranslation } from '@/hooks/use-translation';

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, '0')}`;
}

export default function AdminTimingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const player = useAudioPlayer(undefined, { updateInterval: 100 });
  const status = useAudioPlayerStatus(player);

  const [words, setWords] = useState<string[]>([]);
  const [audioUrl, setAudioUrl] = useState('');
  const [starts, setStarts] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  useEffect(() => {
    (async () => {
      const segment = await getSegment(id);
      if (!segment) return;
      setWords(segment.arabic.split(/\s+/).filter(Boolean));
      setAudioUrl(segment.audioUrl);
    })();
  }, [id]);

  useEffect(() => {
    if (audioUrl) player.replace({ uri: audioUrl });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl]);

  const togglePlay = () => {
    if (status.playing) {
      player.pause();
      return;
    }
    if (status.duration > 0 && status.currentTime >= status.duration - 0.2) player.seekTo(0);
    player.play();
  };

  const reset = () => {
    setStarts([]);
    setCurrentIndex(0);
    player.seekTo(0);
  };

  const markWord = () => {
    if (currentIndex >= words.length) return;
    const ms = Math.round(status.currentTime * 1000);
    setStarts((prev) => {
      const next = [...prev];
      next[currentIndex] = ms;
      return next;
    });
    setCurrentIndex((i) => i + 1);
  };

  const handleSave = async () => {
    setSaving(true);
    const durationMs = Math.round(status.duration * 1000);
    const timings: WordTiming[] = words.map((text, i) => ({
      text,
      startMs: starts[i] ?? 0,
      endMs: starts[i + 1] ?? durationMs,
    }));
    const { error } = await updateSegmentWords(id, timings);
    setSaving(false);
    if (error) {
      Alert.alert(t('admin.errorSave'));
      return;
    }
    router.back();
  };

  const allMarked = currentIndex >= words.length && words.length > 0;

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
            {t('admin.timingsTitle')}
          </ThemedText>

          {!audioUrl ? (
            <ThemedText themeColor="textSecondary">{t('admin.timingsNoAudio')}</ThemedText>
          ) : (
            <>
              <ThemedText type="small" themeColor="textSecondary">
                {t('admin.timingsIntro')}
              </ThemedText>

              <ThemedView type="backgroundElement" style={styles.wordsCard}>
                <ThemedText style={styles.arabic}>
                  {words.map((word, index) => (
                    <Text
                      key={index}
                      style={
                        index < currentIndex
                          ? styles.wordDone
                          : index === currentIndex
                            ? styles.wordCurrent
                            : undefined
                      }>
                      {word}
                      {index < words.length - 1 ? ' ' : ''}
                    </Text>
                  ))}
                </ThemedText>
              </ThemedView>

              <View style={styles.controls}>
                <Pressable
                  onPress={togglePlay}
                  style={({ pressed }) => [styles.playButton, pressed && styles.pressed]}>
                  <ThemedText style={styles.playIcon}>{status.playing ? '❚❚' : '▶'}</ThemedText>
                </Pressable>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  {formatTime(status.currentTime)} / {formatTime(status.duration)}
                </ThemedText>
                <Pressable onPress={reset} hitSlop={Spacing.two}>
                  <ThemedText type="smallBold" themeColor="textSecondary">
                    {t('admin.timingsReset')}
                  </ThemedText>
                </Pressable>
              </View>

              <Pressable
                onPress={markWord}
                disabled={allMarked}
                style={({ pressed }) => [
                  styles.markButton,
                  allMarked && styles.markDone,
                  pressed && styles.pressed,
                ]}>
                <ThemedText style={styles.markLabel}>
                  {allMarked
                    ? t('admin.timingsDone')
                    : t('admin.timingsMark', { word: words[currentIndex] ?? '' })}
                </ThemedText>
              </Pressable>

              <Pressable
                disabled={saving || !allMarked}
                onPress={handleSave}
                style={({ pressed }) => [
                  styles.saveButton,
                  !allMarked && styles.saveDisabled,
                  pressed && styles.pressed,
                ]}>
                <ThemedText style={styles.saveLabel}>{t('admin.save')}</ThemedText>
              </Pressable>
            </>
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
  content: { paddingBottom: Spacing.six, gap: Spacing.three },
  title: { fontSize: 30, lineHeight: 36 },
  wordsCard: { borderRadius: Spacing.three, padding: Spacing.four },
  arabic: { fontSize: 26, lineHeight: 48, textAlign: 'right', writingDirection: 'rtl' },
  wordDone: { color: '#2e9e5b' },
  wordCurrent: { color: '#ffffff', backgroundColor: '#0C5A44' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0C5A44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  markButton: {
    backgroundColor: '#0C5A44',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.four,
    alignItems: 'center',
  },
  markDone: { backgroundColor: '#2e9e5b' },
  markLabel: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  saveButton: {
    backgroundColor: '#0C5A44',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  saveDisabled: { opacity: 0.4 },
  saveLabel: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  pressed: { opacity: 0.7 },
});
