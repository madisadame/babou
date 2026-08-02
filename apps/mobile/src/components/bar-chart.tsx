import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export type BarDatum = { label: string; value: number };

// Graphique à barres verticales, 100 % React Native (aucune lib externe) →
// fonctionne sur iOS, Android et Web. Défile horizontalement s'il y a beaucoup
// de barres.
export function BarChart({ data }: { data: BarDatum[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}>
      {data.map((d, i) => (
        <View key={i} style={styles.col}>
          <ThemedText type="small" style={styles.value}>
            {d.value}
          </ThemedText>
          <View style={styles.track}>
            <View style={[styles.bar, { height: `${Math.round((d.value / max) * 100)}%` }]} />
          </View>
          <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
            {d.label}
          </ThemedText>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 12, alignItems: 'flex-end', paddingVertical: 8 },
  col: { alignItems: 'center', width: 42, gap: 4 },
  value: { color: '#F5EEDA', fontWeight: '700' },
  track: { height: 120, width: 22, justifyContent: 'flex-end' },
  bar: {
    width: '100%',
    minHeight: 3,
    backgroundColor: '#0C5A44',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  label: { fontSize: 11 },
});
