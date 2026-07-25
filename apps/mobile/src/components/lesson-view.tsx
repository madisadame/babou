import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { LessonSegment } from '@/domain/lesson';
import { useTranslation } from '@/hooks/use-translation';

type LessonViewProps = {
  segments: LessonSegment[];
};

// Mots à afficher pour un segment : ceux du modèle (words[]) si présents,
// sinon découpage du texte arabe par les espaces.
function wordsOf(segment: LessonSegment): string[] {
  if (segment.words && segment.words.length) return segment.words.map((w) => w.text);
  return segment.arabic.split(/\s+/).filter(Boolean);
}

// Indice du mot courant pendant la lecture. Utilise les timings réels
// (startMs) s'ils existent, sinon répartit les mots régulièrement sur la durée.
function currentWordIndex(
  segment: LessonSegment,
  currentSec: number,
  durationSec: number,
): number {
  const words = segment.words;
  if (words && words.length && words[0].startMs != null) {
    const ms = currentSec * 1000;
    let index = -1;
    for (let i = 0; i < words.length; i += 1) {
      if (words[i].startMs != null && ms >= (words[i].startMs as number)) index = i;
    }
    return index;
  }
  const count = wordsOf(segment).length;
  if (durationSec <= 0 || count === 0) return -1;
  return Math.min(count - 1, Math.floor((currentSec / durationSec) * count));
}

// Rend une leçon : pour chaque segment, le texte arabe (droite-à-gauche) puis
// sa traduction. Si le segment a un audio, un bouton ▶ le lit et les mots se
// surlignent au fil de la lecture (karaoké). Un seul lecteur réutilisé.
export function LessonView({ segments }: LessonViewProps) {
  const { t, locale } = useTranslation();
  // updateInterval court → position rafraîchie ~10x/s pour un karaoké fluide.
  const player = useAudioPlayer(undefined, { updateInterval: 100 });
  const status = useAudioPlayerStatus(player);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  const toggle = (segment: LessonSegment) => {
    if (!segment.audioUrl) return;
    if (activeId === segment.id && status.playing) {
      player.pause();
      return;
    }
    player.replace({ uri: segment.audioUrl });
    player.play();
    setActiveId(segment.id);
  };

  return (
    <View style={styles.container}>
      {segments.map((segment) => {
        const translation = segment.translations[locale] ?? segment.translations.fr;
        const isPlaying = activeId === segment.id && status.playing;
        const words = wordsOf(segment);
        const highlight = isPlaying
          ? currentWordIndex(segment, status.currentTime, status.duration)
          : -1;
        return (
          <View key={segment.id} style={styles.segment}>
            <View style={styles.arabicRow}>
              {segment.audioUrl ? (
                <Pressable
                  onPress={() => toggle(segment)}
                  accessibilityRole="button"
                  accessibilityLabel={isPlaying ? t('audio.pause') : t('audio.play')}
                  style={({ pressed }) => [styles.playButton, pressed && styles.pressed]}>
                  <ThemedText style={styles.playIcon}>{isPlaying ? '❚❚' : '▶'}</ThemedText>
                </Pressable>
              ) : null}
              <ThemedText style={styles.arabic}>
                {words.map((word, index) => (
                  <Text key={index} style={index === highlight ? styles.wordActive : undefined}>
                    {word}
                    {index < words.length - 1 ? ' ' : ''}
                  </Text>
                ))}
              </ThemedText>
            </View>
            {translation ? (
              <ThemedText themeColor="textSecondary" style={styles.translation}>
                {translation}
              </ThemedText>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  segment: {
    gap: 8,
  },
  arabicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#3c87f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  playIcon: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  arabic: {
    flex: 1,
    fontSize: 26,
    lineHeight: 46,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  wordActive: {
    color: '#ffffff',
    backgroundColor: '#3c87f7',
  },
  translation: {
    fontSize: 16,
    lineHeight: 24,
  },
});
