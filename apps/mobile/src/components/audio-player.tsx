import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ProgressBar } from '@/components/progress-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { usePreferences } from '@/hooks/use-preferences';
import { useTranslation } from '@/hooks/use-translation';

function formatRate(rate: number): string {
  return `${rate === 1 ? '1' : String(rate).replace('.', ',')}×`;
}

type AudioPlayerProps = {
  uri: string;
  // Titre affiché sur l'écran verrouillé (généralement le titre du chapitre).
  title?: string;
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
export function AudioPlayer({ uri, title }: AudioPlayerProps) {
  const { t } = useTranslation();
  const { playbackRate, cyclePlaybackRate } = usePreferences();
  const player = useAudioPlayer({ uri });
  const status = useAudioPlayerStatus(player);

  // Applique la vitesse (tonalité conservée) et la met à jour en direct.
  useEffect(() => {
    try {
      player.shouldCorrectPitch = true;
      player.setPlaybackRate(playbackRate, 'high');
    } catch {
      // pas de lecteur prêt
    }
  }, [playbackRate, player]);

  // Lecture en fond (écran verrouillé) + même en mode silencieux (iOS).
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true }).catch(() => {});
    return () => {
      try {
        player.clearLockScreenControls();
      } catch {
        // lecteur déjà libéré
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    try {
      player.shouldCorrectPitch = true;
      player.setPlaybackRate(playbackRate, 'high');
    } catch {
      // pas de lecteur prêt
    }
    player.setActiveForLockScreen(true, { title: title ?? 'Babou', artist: 'Babou' });
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

      <Pressable
        onPress={cyclePlaybackRate}
        accessibilityRole="button"
        accessibilityLabel={t('reading.speed')}
        style={({ pressed }) => [styles.speedPill, pressed && styles.pressed]}>
        <ThemedText type="smallBold" style={styles.speedLabel}>
          {formatRate(playbackRate)}
        </ThemedText>
      </Pressable>
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
    backgroundColor: '#0C5A44',
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
  speedPill: {
    borderWidth: 1,
    borderColor: 'rgba(245, 238, 218, 0.3)',
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    minWidth: 44,
    alignItems: 'center',
  },
  speedLabel: {
    color: '#F5EEDA',
  },
});
