import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { LessonSegment } from '@/domain/lesson';
import { usePreferences } from '@/hooks/use-preferences';
import { useTranslation } from '@/hooks/use-translation';

type LessonViewProps = {
  segments: LessonSegment[];
  // Titre affiché sur l'écran verrouillé (généralement le titre du chapitre).
  title?: string;
};

// Pistes possibles par segment : la récitation arabe, la traduction, l'explication.
type Kind = 'arabic' | 'translation' | 'explanation';
type Track = { segmentId: string; kind: Kind };

function wordsOf(segment: LessonSegment): string[] {
  if (segment.words && segment.words.length) return segment.words.map((w) => w.text);
  return segment.arabic.split(/\s+/).filter(Boolean);
}

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

// Rend une leçon : pour chaque segment, le texte arabe (droite-à-gauche) avec
// un bouton ▶ pour la récitation (surlignage karaoké), puis la traduction avec
// son propre bouton ▶. En haut, deux boutons « Tout écouter » (récitation /
// traduction) enchaînent automatiquement les segments. Un seul lecteur réutilisé.
function formatRate(rate: number): string {
  return `${rate === 1 ? '1' : String(rate).replace('.', ',')}×`;
}

export function LessonView({ segments, title }: LessonViewProps) {
  const { t, locale } = useTranslation();
  const { readingScale, playbackRate, cyclePlaybackRate } = usePreferences();
  const player = useAudioPlayer(undefined, { updateInterval: 100 });
  const status = useAudioPlayerStatus(player);
  const [active, setActive] = useState<Track | null>(null);
  const [queueKind, setQueueKind] = useState<Kind | null>(null);
  const queueRef = useRef<Track[]>([]);
  const queueIndexRef = useRef(0);

  // Mode récitation : masque le texte arabe pour réciter de mémoire ; on touche
  // un segment pour le révéler. La traduction reste visible comme indice.
  const [recitation, setRecitation] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const toggleRecitation = () => {
    setRecitation((on) => {
      if (on) setRevealed({});
      return !on;
    });
  };
  const reveal = (segmentId: string) => setRevealed((prev) => ({ ...prev, [segmentId]: true }));

  useEffect(() => {
    // Lecture en fond (écran verrouillé) + même en mode silencieux (iOS).
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

  // Applique la vitesse (en gardant la tonalité) et la met à jour en direct.
  useEffect(() => {
    try {
      player.shouldCorrectPitch = true;
      player.setPlaybackRate(playbackRate, 'high');
    } catch {
      // pas de lecteur prêt
    }
  }, [playbackRate, player]);

  const uriFor = (segment: LessonSegment, kind: Kind): string | undefined => {
    if (kind === 'arabic') return segment.audioUrl;
    if (kind === 'translation')
      return segment.translationAudio?.[locale] ?? segment.translationAudio?.fr;
    return segment.explanationAudio?.[locale] ?? segment.explanationAudio?.fr;
  };

  const start = (track: Track) => {
    const segment = segments.find((s) => s.id === track.segmentId);
    const uri = segment && uriFor(segment, track.kind);
    if (!uri) return;
    player.replace({ uri });
    player.play();
    try {
      player.shouldCorrectPitch = true;
      player.setPlaybackRate(playbackRate, 'high');
    } catch {
      // pas de lecteur prêt
    }
    setActive(track);
    // Contrôles + infos sur l'écran verrouillé (titre du chapitre + type).
    player.setActiveForLockScreen(true, {
      title: title ?? 'Babou',
      artist:
        track.kind === 'arabic'
          ? t('audio.nowArabic')
          : track.kind === 'translation'
            ? t('audio.nowTranslation')
            : t('audio.nowExplanation'),
    });
  };

  // `start` doit toujours être la version la plus récente pour l'enchaînement.
  const startRef = useRef(start);
  startRef.current = start;

  // Enchaînement auto : quand une piste se termine, jouer la suivante de la file.
  useEffect(() => {
    if (!status.didJustFinish) return;
    const queue = queueRef.current;
    const next = queueIndexRef.current + 1;
    if (queue.length && next < queue.length) {
      queueIndexRef.current = next;
      startRef.current(queue[next]);
    } else {
      queueRef.current = [];
      queueIndexRef.current = 0;
      setActive(null);
      setQueueKind(null);
    }
  }, [status.didJustFinish]);

  const playSingle = (segment: LessonSegment, kind: Kind) => {
    if (!uriFor(segment, kind)) return;
    const isThis = active?.segmentId === segment.id && active.kind === kind;
    if (isThis) {
      if (status.playing) player.pause();
      else player.play();
      return;
    }
    queueRef.current = [];
    queueIndexRef.current = 0;
    setQueueKind(null);
    start({ segmentId: segment.id, kind });
  };

  const playAll = (kind: Kind) => {
    if (queueKind === kind) {
      if (status.playing) player.pause();
      else player.play();
      return;
    }
    const queue = segments.filter((s) => uriFor(s, kind)).map((s) => ({ segmentId: s.id, kind }));
    if (!queue.length) return;
    queueRef.current = queue;
    queueIndexRef.current = 0;
    setQueueKind(kind);
    start(queue[0]);
  };

  const hasArabic = segments.some((s) => uriFor(s, 'arabic'));
  const hasTranslation = segments.some((s) => uriFor(s, 'translation'));
  const isPlayingTrack = (segmentId: string, kind: Kind) =>
    active?.segmentId === segmentId && active.kind === kind && status.playing;
  const isQueuePlaying = (kind: Kind) => queueKind === kind && status.playing;

  return (
    <View style={styles.container}>
      {segments.length > 0 ? (
        <View style={styles.controls}>
          <Pressable
            onPress={toggleRecitation}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.recitBtn,
              recitation && styles.recitBtnOn,
              pressed && styles.pressed,
            ]}>
            <ThemedText type="smallBold" style={recitation ? styles.recitLabelOn : styles.recitLabel}>
              {recitation ? `👁  ${t('reading.showText')}` : `🙈  ${t('reading.reciteMode')}`}
            </ThemedText>
          </Pressable>
          {hasArabic || hasTranslation ? (
            <Pressable
              onPress={cyclePlaybackRate}
              accessibilityRole="button"
              accessibilityLabel={t('reading.speed')}
              style={({ pressed }) => [styles.speedPill, pressed && styles.pressed]}>
              <ThemedText type="smallBold" style={styles.speedLabel}>
                {formatRate(playbackRate)}
              </ThemedText>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {hasArabic || hasTranslation ? (
        <View style={styles.listenAll}>
          {hasArabic ? (
            <Pressable
              onPress={() => playAll('arabic')}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.listenBtn,
                styles.listenArabic,
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold" style={styles.listenLabel}>
                {isQueuePlaying('arabic') ? '❚❚' : '▶'} {t('lesson.listenAllArabic')}
              </ThemedText>
            </Pressable>
          ) : null}
          {hasTranslation ? (
            <Pressable
              onPress={() => playAll('translation')}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.listenBtn,
                styles.listenTranslation,
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold" style={styles.listenLabel}>
                {isQueuePlaying('translation') ? '❚❚' : '▶'} {t('lesson.listenAllTranslation')}
              </ThemedText>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {segments.map((segment) => {
        const translation = segment.translations[locale] ?? segment.translations.fr;
        const explanation = segment.explanations?.[locale] ?? segment.explanations?.fr;
        const arabicPlaying = isPlayingTrack(segment.id, 'arabic');
        const words = wordsOf(segment);
        const highlight = arabicPlaying
          ? currentWordIndex(segment, status.currentTime, status.duration)
          : -1;
        const hasTransAudio = !!uriFor(segment, 'translation');
        const masked = recitation && !revealed[segment.id];
        return (
          <View key={segment.id} style={styles.segment}>
            <View style={styles.arabicRow}>
              {segment.audioUrl ? (
                <Pressable
                  onPress={() => playSingle(segment, 'arabic')}
                  accessibilityRole="button"
                  accessibilityLabel={t('audio.playArabicA11y')}
                  style={({ pressed }) => [styles.playButton, pressed && styles.pressed]}>
                  <ThemedText style={styles.playIcon}>{arabicPlaying ? '❚❚' : '▶'}</ThemedText>
                </Pressable>
              ) : null}
              {masked ? (
                <Pressable
                  onPress={() => reveal(segment.id)}
                  accessibilityRole="button"
                  accessibilityLabel={t('reading.tapReveal')}
                  style={({ pressed }) => [styles.masked, pressed && styles.pressed]}>
                  <ThemedText style={styles.maskedDots}>••••••••</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {t('reading.tapReveal')}
                  </ThemedText>
                </Pressable>
              ) : (
                <ThemedText
                  style={[
                    styles.arabic,
                    { fontSize: 26 * readingScale, lineHeight: 46 * readingScale },
                  ]}>
                  {words.map((word, index) => (
                    <Text key={index} style={index === highlight ? styles.wordActive : undefined}>
                      {word}
                      {index < words.length - 1 ? ' ' : ''}
                    </Text>
                  ))}
                </ThemedText>
              )}
            </View>
            {translation ? (
              <View style={styles.translationRow}>
                {hasTransAudio ? (
                  <Pressable
                    onPress={() => playSingle(segment, 'translation')}
                    accessibilityRole="button"
                    accessibilityLabel={t('audio.playTranslationA11y')}
                    style={({ pressed }) => [styles.playButtonAlt, pressed && styles.pressed]}>
                    <ThemedText style={styles.playIconAlt}>
                      {isPlayingTrack(segment.id, 'translation') ? '❚❚' : '▶'}
                    </ThemedText>
                  </Pressable>
                ) : null}
                <ThemedText
                  themeColor="textSecondary"
                  style={[
                    styles.translation,
                    { fontSize: 16 * readingScale, lineHeight: 24 * readingScale },
                  ]}>
                  {translation}
                </ThemedText>
              </View>
            ) : null}
            {explanation ? (
              <View style={styles.explanationBox}>
                <View style={styles.explanationHead}>
                  <ThemedText type="small" style={styles.explanationLabel}>
                    💡 {t('lesson.explanation')}
                  </ThemedText>
                  {uriFor(segment, 'explanation') ? (
                    <Pressable
                      onPress={() => playSingle(segment, 'explanation')}
                      accessibilityRole="button"
                      accessibilityLabel={t('audio.playExplanationA11y')}
                      style={({ pressed }) => [styles.playButtonAlt, pressed && styles.pressed]}>
                      <ThemedText style={styles.playIconAlt}>
                        {isPlayingTrack(segment.id, 'explanation') ? '❚❚' : '▶'}
                      </ThemedText>
                    </Pressable>
                  ) : null}
                </View>
                <ThemedText
                  style={[
                    styles.explanationText,
                    { fontSize: 15 * readingScale, lineHeight: 24 * readingScale },
                  ]}>
                  {explanation}
                </ThemedText>
              </View>
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
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  recitBtn: {
    borderWidth: 1,
    borderColor: 'rgba(245, 238, 218, 0.3)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  recitBtnOn: {
    backgroundColor: '#0C5A44',
    borderColor: '#0C5A44',
  },
  recitLabel: {
    color: '#F5EEDA',
  },
  recitLabelOn: {
    color: '#F5EEDA',
  },
  masked: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 238, 218, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 2,
  },
  maskedDots: {
    fontSize: 22,
    letterSpacing: 6,
    color: 'rgba(245, 238, 218, 0.45)',
  },
  speedPill: {
    borderWidth: 1,
    borderColor: 'rgba(245, 238, 218, 0.3)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  speedLabel: {
    color: '#F5EEDA',
  },
  listenAll: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  listenBtn: {
    flexGrow: 1,
    flexBasis: 150,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  listenArabic: {
    backgroundColor: '#0C5A44',
  },
  listenTranslation: {
    borderWidth: 1,
    borderColor: 'rgba(245, 238, 218, 0.35)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  listenLabel: {
    color: '#F5EEDA',
  },
  segment: {
    gap: 10,
  },
  arabicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  translationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0C5A44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonAlt: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(245, 238, 218, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  playIcon: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  playIconAlt: {
    color: '#F5EEDA',
    fontSize: 11,
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
    backgroundColor: '#0C5A44',
  },
  translation: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
  // Bloc explication : distinct de la traduction (accent latéral + fond doux).
  explanationBox: {
    borderLeftWidth: 3,
    borderLeftColor: '#E0BE6D',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 4,
  },
  explanationHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  explanationLabel: {
    color: '#E0BE6D',
    fontWeight: '700',
  },
  explanationText: {
    color: '#F5EEDA',
    fontSize: 15,
    lineHeight: 24,
  },
});
