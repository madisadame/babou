import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { LessonSegment } from '@/domain/lesson';
import { useTranslation } from '@/hooks/use-translation';

type LessonViewProps = {
  segments: LessonSegment[];
};

// Rend une leçon : pour chaque segment, le texte arabe (droite-à-gauche) puis
// sa traduction. Si le segment a un audio, un bouton ▶ le lit. Un seul lecteur
// est réutilisé (change de source) : une seule phrase joue à la fois.
export function LessonView({ segments }: LessonViewProps) {
  const { t, locale } = useTranslation();
  const player = useAudioPlayer();
  const status = useAudioPlayerStatus(player);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Jouer même en mode silencieux (iOS).
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
              <ThemedText style={styles.arabic}>{segment.arabic}</ThemedText>
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
  translation: {
    fontSize: 16,
    lineHeight: 24,
  },
});
