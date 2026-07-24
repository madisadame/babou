import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useChapter } from '@/hooks/use-content';
import { useReadingProgress } from '@/hooks/use-reading-progress';

// Lecture d'un chapitre. Le contenu réel (texte arabe + traduction + audio +
// vidéo) viendra du backend (étape 7) et du lecteur pédagogique (étape 4) ; en
// attendant, texte d'exemple neutre. La progression est calculée au défilement.
export default function ChapterReadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { chapter, loading } = useChapter(id);
  const { getProgress, setProgress, resetProgress } = useReadingProgress();

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!chapter) return;
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollable = contentSize.height - layoutMeasurement.height;
    // Si tout tient à l'écran, le chapitre est considéré comme lu.
    const fraction = scrollable <= 0 ? 1 : contentOffset.y / scrollable;
    setProgress(chapter.id, fraction);
  };

  const handleResetProgress = () => {
    if (!chapter) return;
    Alert.alert(
      'Réinitialiser la progression',
      'Ta progression de lecture pour ce chapitre sera effacée. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Réinitialiser', style: 'destructive', onPress: () => resetProgress(chapter.id) },
      ],
    );
  };

  const progress = chapter ? getProgress(chapter.id) : 0;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()} hitSlop={Spacing.three} style={styles.back}>
          <ThemedText type="link" themeColor="textSecondary">
            ← Retour
          </ThemedText>
        </Pressable>

        {loading ? (
          <ThemedText themeColor="textSecondary" style={styles.centered}>
            Chargement…
          </ThemedText>
        ) : chapter ? (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={50}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              Chapitre {chapter.order} · {Math.round(progress * 100)} % lu
            </ThemedText>
            <ThemedText type="title" style={styles.title}>
              {chapter.title}
            </ThemedText>

            <ThemedText style={styles.lead}>{chapter.description}</ThemedText>

            <ThemedText style={styles.paragraph}>
              Ce chapitre t&apos;accompagne pas à pas dans la découverte du sujet.
              Prends ton temps : chaque notion est présentée simplement, pour être
              comprise puis mise en pratique.
            </ThemedText>
            <ThemedText style={styles.paragraph}>
              La lecture est pensée pour progresser sereinement, une idée après
              l&apos;autre. Ta progression est enregistrée automatiquement à mesure
              que tu avances.
            </ThemedText>
            <ThemedText style={styles.paragraph}>
              Tu pourras revenir à tout moment sur les passages importants et
              reprendre ta lecture là où tu t&apos;étais arrêté, d&apos;un appareil à
              l&apos;autre une fois ton compte connecté.
            </ThemedText>
            <ThemedText style={styles.paragraph}>
              Bientôt, ce chapitre proposera le texte en arabe, sa traduction, une
              lecture audio et une vidéo où les mots seront suivis au fil de la
              récitation.
            </ThemedText>

            <ThemedView type="backgroundElement" style={styles.notice}>
              <ThemedText type="smallBold">Texte d&apos;exemple</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Le contenu pédagogique complet de ce chapitre sera ajouté depuis
                l&apos;espace d&apos;administration (étape 5) puis servi par le
                backend (étape 7).
              </ThemedText>
            </ThemedView>

            {progress > 0 ? (
              <Pressable
                onPress={handleResetProgress}
                hitSlop={Spacing.two}
                style={styles.resetButton}>
                <ThemedText type="link" themeColor="textSecondary">
                  Réinitialiser la progression
                </ThemedText>
              </Pressable>
            ) : null}
          </ScrollView>
        ) : (
          <ThemedView style={styles.notFound}>
            <ThemedText type="subtitle">Chapitre introuvable</ThemedText>
            <ThemedText themeColor="textSecondary">
              Ce chapitre n&apos;existe pas ou n&apos;est plus disponible.
            </ThemedText>
          </ThemedView>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  back: {
    marginBottom: Spacing.three,
  },
  content: {
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
  },
  lead: {
    fontSize: 18,
    lineHeight: 28,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 26,
  },
  notice: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  resetButton: {
    alignSelf: 'center',
    marginTop: Spacing.two,
  },
  centered: {
    textAlign: 'center',
    marginTop: Spacing.five,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.two,
  },
});
