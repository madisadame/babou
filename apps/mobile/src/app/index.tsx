import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

// Écran d'accueil : message d'introduction présentant le cadre de Babou
// (outil pédagogique de complément, méthodologie Shâfi'î annoncée) avant
// d'accéder à la bibliothèque. Texte validé avec l'utilisateur.
export default function HomeScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText type="title" style={styles.title}>
            Bienvenue sur Babou
          </ThemedText>

          <ThemedText style={styles.paragraph}>
            Babou est un outil pédagogique conçu pour t&apos;accompagner dans
            l&apos;apprentissage et la révision de ta religion, en particulier lorsque
            tu n&apos;as pas toujours la possibilité d&apos;assister à des cours.
          </ThemedText>

          <ThemedText style={styles.paragraph}>
            Cette application <Text style={styles.bold}>ne remplace en aucun cas</Text> les
            enseignants, les imams, les professeurs et les gens de science. Elle est pensée
            comme un <Text style={styles.bold}>complément d&apos;apprentissage</Text>, et non
            comme une référence unique : rien ne saurait se substituer à l&apos;enseignement
            transmis par des personnes qualifiées.
          </ThemedText>

          <ThemedText style={styles.paragraph}>
            Il existe plusieurs écoles juridiques (madhahib) reconnues, ainsi que des
            personnes qui choisissent de ne suivre aucune école en particulier. Le contenu de
            Babou s&apos;appuie principalement sur la méthodologie de
            l&apos;<Text style={styles.bold}>école de l&apos;Imam Ash-Shâfi&apos;î</Text>, car
            c&apos;est cet enseignement que l&apos;application a vocation à transmettre.
          </ThemedText>

          <ThemedText style={styles.paragraph}>
            Ce choix n&apos;a pas pour but de critiquer les autres approches, toutes dignes de
            respect, mais simplement d&apos;<Text style={styles.bold}>annoncer clairement le
            cadre</Text> dans lequel Babou a été conçu, afin d&apos;éviter toute ambiguïté.
          </ThemedText>

          <ThemedText themeColor="textSecondary" style={styles.invocation}>
            Qu&apos;Allah facilite ton apprentissage et t&apos;accorde la science utile.
          </ThemedText>

          <Pressable
            onPress={() => router.push('/library')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
            <ThemedText style={styles.ctaLabel}>Accéder à la bibliothèque</ThemedText>
          </Pressable>
        </ScrollView>
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
  },
  content: {
    paddingTop: Spacing.five,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    marginBottom: Spacing.two,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 26,
  },
  bold: {
    fontWeight: '700',
  },
  invocation: {
    fontSize: 16,
    lineHeight: 26,
    fontStyle: 'italic',
    marginTop: Spacing.two,
  },
  cta: {
    backgroundColor: '#3c87f7',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.five,
  },
  ctaPressed: {
    opacity: 0.8,
  },
  ctaLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
