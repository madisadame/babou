import { Component, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

// Barrière d'erreur globale : si un écran plante au rendu, on affiche un
// message propre plutôt qu'un écran blanc, avec un bouton « Réessayer ».
// Couleurs codées en dur (indépendant de tout contexte) pour rester sûr même
// si l'erreur vient d'un provider.
type Props = { children: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(): void {
    // Point d'accroche pour un rapport d'erreur (Sentry, etc.) plus tard.
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.container}>
        <Text style={styles.emoji}>🌙</Text>
        <Text style={styles.title}>Une erreur est survenue</Text>
        <Text style={styles.body}>
          Ferme puis rouvre l&apos;application. Si le problème persiste, réessaie plus tard.
        </Text>
        <Pressable
          onPress={() => this.setState({ hasError: false })}
          style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]}>
          <Text style={styles.buttonLabel}>Réessayer</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#08301F',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  emoji: { fontSize: 44 },
  title: { color: '#F5EEDA', fontSize: 22, fontWeight: '700', textAlign: 'center' },
  body: {
    color: 'rgba(245,238,218,0.7)',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 320,
  },
  button: {
    marginTop: 12,
    backgroundColor: '#F5EEDA',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  buttonLabel: { color: '#0C5A44', fontSize: 16, fontWeight: '700' },
});
