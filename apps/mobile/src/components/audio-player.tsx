import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ProgressBar } from '@/components/progress-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTranslation } from '@/hooks/use-translation';

type AudioPlayerProps = {
  uri: string;
};

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

// Lecteur audio d'une leçon : lecture / pause + barre de progression + temps.
// Piloté par une URL (fournie par le contenu). Le suivi mot-à-mot (karaoké)
// s'appuiera plus tard sur les timings du modèle (LessonWord).
export function AudioPlayer({ uri }: AudioPlayerProps) {
  const { t } = useTranslation();
  const player = useAudioPlayer({ uri });
  const status = useAudioPlayerStatus(player);

  // Jouer même si le téléphone est en mode silencieux (iOS).
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  const progress = status.duration > 0 ? status.currentTime / status.duration : 0;

  const toggle = () => {
    if (status.playing) {
      player.pause();
      return;
    }
    // Relancer depuis le début si la lecture est terminée.
    if (status.duration > 0 && status.currentTime >= status.duration - 0.2) {
      player.seekTo(0);
    }
    player.play();
  };

  return (
    <ThemedView type="backgroundElement" style={styles.container}>
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityLabel={status.playing ? t('audio.pause') : t('audio.play')}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <ThemedText style={styles.icon}>{status.playing ? '❚❚' : '▶'}</ThemedText>
      </Pressable>

      <View style={styles.body}>
        <ProgressBar value={progress} />
        <ThemedText type="small" themeColor="textSecondary">
          {formatTime(status.currentTime)} / {status.isLoaded ? formatTime(status.duration) : '—'}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3c87f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  icon: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    gap: Spacing.two,
  },
});
