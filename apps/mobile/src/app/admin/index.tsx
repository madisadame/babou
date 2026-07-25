import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { Book } from '@/domain/book';
import { contentRepository } from '@/data/content-repository';
import { deleteBook } from '@/data/supabase/admin-repository';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from '@/hooks/use-translation';

export default function AdminBooksScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setBooks(await contentRepository.getBooks());
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const confirmDelete = (book: Book) => {
    Alert.alert(book.title, t('admin.deleteBookConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('admin.delete'),
        style: 'destructive',
        onPress: async () => {
          const { error } = await deleteBook(book.id);
          if (error) Alert.alert(t('admin.errorSave'));
          load();
        },
      },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.back()} hitSlop={Spacing.three} style={styles.back}>
          <ThemedText type="link" themeColor="textSecondary">
            ← {t('common.back')}
          </ThemedText>
        </Pressable>

        {!isAdmin ? (
          <ThemedText themeColor="textSecondary" style={styles.centered}>
            {t('admin.denied')}
          </ThemedText>
        ) : (
          <FlatList
            data={books}
            keyExtractor={(book) => book.id}
            ListHeaderComponent={
              <View style={styles.header}>
                <ThemedText type="title" style={styles.title}>
                  {t('admin.title')}
                </ThemedText>
                <Pressable
                  onPress={() => router.push({ pathname: '/admin/book/[id]', params: { id: 'new' } })}
                  style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
                  <ThemedText style={styles.addLabel}>+ {t('admin.newBook')}</ThemedText>
                </Pressable>
              </View>
            }
            renderItem={({ item }) => (
              <ThemedView type="backgroundElement" style={styles.row}>
                <Link href={{ pathname: '/admin/book/[id]', params: { id: item.id } }} asChild>
                  <Pressable style={styles.rowInfo}>
                    <ThemedText type="smallBold">{item.title}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {item.category} · {item.chapterCount}
                    </ThemedText>
                  </Pressable>
                </Link>
                <Pressable
                  onPress={() => confirmDelete(item)}
                  hitSlop={Spacing.two}
                  accessibilityLabel={t('admin.delete')}
                  style={({ pressed }) => pressed && styles.pressed}>
                  <ThemedText style={styles.deleteIcon}>🗑</ThemedText>
                </Pressable>
              </ThemedView>
            )}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <ThemedText themeColor="textSecondary" style={styles.centered}>
                {loading ? t('common.loading') : t('admin.noBooks')}
              </ThemedText>
            }
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.four },
  back: { marginBottom: Spacing.three },
  header: { gap: Spacing.three, marginBottom: Spacing.three },
  title: { fontSize: 34, lineHeight: 40 },
  list: { gap: Spacing.two, paddingBottom: Spacing.six },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Spacing.three,
    padding: Spacing.four,
  },
  rowInfo: { flex: 1, gap: Spacing.half },
  deleteIcon: { fontSize: 18 },
  addButton: {
    backgroundColor: '#3c87f7',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  addLabel: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  pressed: { opacity: 0.6 },
  centered: { textAlign: 'center', marginTop: Spacing.five },
});
