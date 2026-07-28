import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import {
  addAdminByEmail,
  listAdmins,
  removeAdmin,
  type AdminUser,
} from '@/data/supabase/admin-repository';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

// Gestion des administrateurs : lister, ajouter par e-mail, retirer.
export default function AdminAdminsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { t } = useTranslation();
  const { isAdmin, user } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setAdmins(await listAdmins());
  }, []);
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleAdd = async () => {
    if (!email.trim()) {
      setMessage(t('admin.adminNeedEmail'));
      return;
    }
    const result = await addAdminByEmail(email);
    if (result === 'ok') {
      setEmail('');
      setMessage(t('admin.adminAdded'));
      load();
    } else if (result === 'not_found') {
      setMessage(t('admin.adminNotFound'));
    } else if (result === 'forbidden') {
      setMessage(t('admin.denied'));
    } else {
      setMessage(t('admin.errorSave'));
    }
  };

  const confirmRemove = (admin: AdminUser) => {
    Alert.alert(admin.email, t('admin.adminRemoveConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('admin.delete'),
        style: 'destructive',
        onPress: async () => {
          await removeAdmin(admin.userId);
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
            data={admins}
            keyExtractor={(a) => a.userId}
            ListHeaderComponent={
              <View style={styles.header}>
                <ThemedText type="title" style={styles.title}>
                  {t('admin.adminsTitle')}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('admin.adminsHint')}
                </ThemedText>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t('auth.email')}
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[
                    styles.input,
                    { backgroundColor: theme.backgroundElement, color: theme.text },
                  ]}
                />
                <Pressable
                  onPress={handleAdd}
                  style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                  <ThemedText style={styles.primaryLabel}>{t('admin.adminAdd')}</ThemedText>
                </Pressable>
                {message ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {message}
                  </ThemedText>
                ) : null}
                <ThemedText type="smallBold" themeColor="textSecondary" style={styles.section}>
                  {t('admin.adminsListSection')}
                </ThemedText>
              </View>
            }
            renderItem={({ item }) => (
              <ThemedView type="backgroundElement" style={styles.row}>
                <ThemedText type="smallBold" style={styles.rowEmail} numberOfLines={1}>
                  {item.email}
                  {item.userId === user?.id ? (
                    <ThemedText type="small" themeColor="textSecondary">
                      {'  '}
                      {t('admin.adminYou')}
                    </ThemedText>
                  ) : null}
                </ThemedText>
                {item.userId !== user?.id ? (
                  <Pressable
                    onPress={() => confirmRemove(item)}
                    hitSlop={Spacing.two}
                    accessibilityLabel={t('admin.delete')}>
                    <ThemedText style={styles.remove}>✕</ThemedText>
                  </Pressable>
                ) : null}
              </ThemedView>
            )}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <ThemedText themeColor="textSecondary" style={styles.centered}>
                {t('admin.adminsEmpty')}
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
  header: { gap: Spacing.two, marginBottom: Spacing.three },
  title: { fontSize: 30, lineHeight: 36 },
  input: {
    height: 44,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#0C5A44',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  primaryLabel: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  section: { marginTop: Spacing.two, letterSpacing: 1 },
  list: { gap: Spacing.two, paddingBottom: Spacing.six },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  rowEmail: { flex: 1 },
  remove: { color: '#e5484d', fontSize: 16, fontWeight: '700' },
  centered: { textAlign: 'center', marginTop: Spacing.five },
  pressed: { opacity: 0.6 },
});
