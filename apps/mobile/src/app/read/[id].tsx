import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { mockBooks } from '@/data/mock-books';

// Écran de lecture d'un livre. Le contenu réel des chapitres viendra du
// backend (étape 6) ; en attendant, on affiche un texte d'exemple neutre,
// clairement signalé, pour démontrer l'expérience de lecture.
export default function BookReadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const book = mockBooks.find((item) => item.id === id);

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
            <ThemedText type="smallBold" themeColor="textSecondary">
              {book.category}
            </ThemedText>
            <ThemedText type="title" style={styles.title}>
              {book.title}
            </ThemedText>

            <ThemedText style={styles.lead}>{book.description}</ThemedText>

            <ThemedText style={styles.paragraph}>
              Ce chapitre t&apos;accompagne pas à pas dans la découverte du sujet.
              Prends ton temps : chaque notion est présentée simplement, pour être
              comprise puis mise en pratique.
            </ThemedText>
            <ThemedText style={styles.paragraph}>
              Tu pourras revenir à tout moment sur les passages importants et
              reprendre ta lecture là où tu t&apos;étais arrêté.
            </ThemedText>

            <ThemedView type="backgroundElement" style={styles.notice}>
              <ThemedText type="smallBold">Texte d&apos;exemple</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Le contenu pédagogique complet de ce livre sera ajouté depuis
                l&apos;espace d&apos;administration (étape 5) puis servi par le
                backend (étape 6).
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
  notFound: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.two,
  },
});
