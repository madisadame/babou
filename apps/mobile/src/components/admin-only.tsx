import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from '@/hooks/use-translation';

// Garde des écrans d'administration.
//
// Enveloppe l'écran plutôt que d'ajouter une condition à l'intérieur : ainsi
// le composant gardé n'est même pas monté pour un non-admin, donc aucun de ses
// hooks (chargements, écritures) ne s'exécute. Un retour anticipé à l'intérieur
// de l'écran n'aurait pas cette garantie, les hooks devant être appelés
// inconditionnellement.
//
// Rappel : ceci protège l'INTERFACE. Les données, elles, sont protégées par la
// RLS côté Supabase — les deux sont nécessaires.
export function AdminOnly({ children }: { children: ReactNode }) {
  const { isAdmin, loading } = useAuth();
  const { t } = useTranslation();

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText themeColor="textSecondary" style={styles.centered}>
            {t('common.loading')}
          </ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (!isAdmin) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText themeColor="textSecondary" style={styles.centered}>
            {t('admin.denied')}
          </ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.four },
  centered: { textAlign: 'center', marginTop: Spacing.six },
});
