import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProgressBar } from '@/components/progress-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { mockBooks } from '@/data/mock-books';
import { useReadingProgress } from '@/hooks/use-reading-progress';

// Écran de détail d'un livre. La route dynamique [id] reçoit l'identifiant
// depuis la carte de la liste. Comme les écrans, il ne dépend que de la forme
// des données (Book) : brancher le backend (étape 6) suffira sans le modifier.
export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [isCoverOpen, setIsCoverOpen] = useState(false);

  const { getProgress } = useReadingProgress();

  const book = mockBooks.find((item) => item.id === id);
  const progress = book ? getProgress(book.id) : 0;

  const openReader = () => {
    if (book) router.push({ pathname: '/read/[id]', params: { id: book.id } });
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()} hitSlop={Spacing.three} style={styles.back}>
          <ThemedText type="link" themeColor="textSecondary">
            ← Retour
          </ThemedText>
        </Pressable>

        {book ? (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}>
            {book.coverUrl ? (
              <Pressable
                onPress={() => setIsCoverOpen(true)}
                accessibilityRole="imagebutton"
                accessibilityLabel="Agrandir la couverture"
                style={({ pressed }) => (pressed ? styles.coverPressed : undefined)}>
                <Image
                  source={{ uri: book.coverUrl }}
                  style={styles.cover}
                  contentFit="cover"
                  transition={200}
                  accessibilityIgnoresInvertColors
                />
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => router.navigate({ pathname: '/', params: { category: book.category } })}
              accessibilityRole="button"
              accessibilityLabel={`Voir tous les livres de la catégorie ${book.category}`}
              style={({ pressed }) => [styles.categoryButton, pressed && styles.categoryPressed]}>
              <ThemedView type="backgroundElement" style={styles.categoryBadge}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  {book.category} ›
                </ThemedText>
              </ThemedView>
            </Pressable>
            <ThemedText type="title" style={styles.title}>
              {book.title}
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.description}>
              {book.description}
            </ThemedText>

            <Pressable
              onPress={openReader}
              style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
              <ThemedText style={styles.ctaLabel}>
                {progress > 0
                  ? `Continuer la lecture (${Math.round(progress * 100)} %)`
                  : 'Commencer la lecture'}
              </ThemedText>
            </Pressable>
            {progress > 0 ? <ProgressBar value={progress} /> : null}

            <ThemedView type="backgroundElement" style={styles.placeholder}>
              <ThemedText type="smallBold">Contenu du livre</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Les chapitres seront disponibles une fois le backend connecté
                (étape 6 de la feuille de route).
              </ThemedText>
            </ThemedView>
          </ScrollView>
        ) : (
          <ThemedView style={styles.notFound}>
            <ThemedText type="subtitle">Livre introuvable</ThemedText>
            <ThemedText themeColor="textSecondary">
              Ce livre n&apos;existe pas ou n&apos;est plus disponible.
            </ThemedText>
          </ThemedView>
        )}

        <Modal
          visible={isCoverOpen}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setIsCoverOpen(false)}>
          <Pressable style={styles.backdrop} onPress={() => setIsCoverOpen(false)}>
            {book?.coverUrl ? (
              <Image
                source={{ uri: book.coverUrl }}
                style={styles.fullCover}
                contentFit="contain"
                transition={150}
                accessibilityIgnoresInvertColors
              />
            ) : null}
            <ThemedText type="small" style={styles.hint}>
              Toucher pour fermer
            </ThemedText>
          </Pressable>
        </Modal>
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
  cover: {
    width: 180,
    height: 240,
    borderRadius: Spacing.three,
    alignSelf: 'center',
  },
  coverPressed: {
    opacity: 0.85,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.four,
  },
  fullCover: {
    width: '100%',
    height: '75%',
  },
  hint: {
    color: '#ffffff',
    opacity: 0.7,
  },
  categoryButton: {
    alignSelf: 'flex-start',
  },
  categoryPressed: {
    opacity: 0.6,
  },
  categoryBadge: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  cta: {
    backgroundColor: '#3c87f7',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  ctaPressed: {
    opacity: 0.8,
  },
  ctaLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 600,
  },
  placeholder: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.two,
  },
});
