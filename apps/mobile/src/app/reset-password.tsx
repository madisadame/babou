import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { supabase } from '@/data/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { useTranslation } from '@/hooks/use-translation';

const CREAM = '#F5EEDA';
const GREEN = '#0C5A44';

// Délai laissé au lien pour être traité avant de le déclarer invalide.
// L'ouverture par lien profond et l'établissement de session sont asynchrones :
// conclure trop tôt afficherait « lien expiré » sur un lien parfaitement valide.
const DELAI_VERIFICATION = 4000;

type Etape = 'verification' | 'pret' | 'invalide' | 'enregistre';

// Jetons transmis par Supabase au retour du lien d'e-mail. Selon le type de
// flux, ils arrivent dans le fragment (#access_token=…) ou en paramètre de
// requête (?code=…) : on gère les deux.
function extraireJetons(url: string) {
  const [avantFragment, fragment] = url.split('#');
  const dansFragment = new URLSearchParams(fragment ?? '');
  const dansRequete = new URLSearchParams(avantFragment.split('?')[1] ?? '');
  const lire = (nom: string) => dansFragment.get(nom) ?? dansRequete.get(nom);
  return {
    accessToken: lire('access_token'),
    refreshToken: lire('refresh_token'),
    code: lire('code'),
    erreur: lire('error_description') ?? lire('error'),
  };
}

// Écran de réinitialisation du mot de passe, atteint depuis l'e-mail Supabase
// (lien `babou://reset-password`).
//
// Le client est configuré avec `detectSessionInUrl: false` — nécessaire en
// React Native, où il n'y a pas d'URL de navigateur à inspecter. C'est donc à
// cet écran d'ouvrir la session à partir des jetons du lien, sans quoi
// `updateUser({ password })` échouerait faute de session.
export default function ResetPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useTheme();
  const { updatePassword } = useAuth();

  const [etape, setEtape] = useState<Etape>('verification');
  const [motDePasse, setMotDePasse] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);
  const traite = useRef(false);

  const ouvrirSession = useCallback(async (url: string | null) => {
    if (!url || traite.current || !supabase) return;
    const { accessToken, refreshToken, code, erreur } = extraireJetons(url);

    if (erreur) {
      traite.current = true;
      setEtape('invalide');
      return;
    }

    try {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) return;
      } else if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) return;
      } else {
        return; // pas de jeton dans cette URL : on laisse le délai décider
      }
      traite.current = true;
      setEtape('pret');
    } catch {
      // réseau indisponible : le délai basculera sur « invalide »
    }
  }, []);

  useEffect(() => {
    // L'app peut être lancée par le lien (URL initiale) ou déjà ouverte
    // au moment où il est suivi (événement).
    Linking.getInitialURL().then(ouvrirSession);
    const sub = Linking.addEventListener('url', (e) => ouvrirSession(e.url));

    // Cas de figure restant : une session de récupération déjà établie
    // (l'utilisateur revient sur l'écran après un aller-retour).
    supabase?.auth.getSession().then(({ data }) => {
      if (data.session && !traite.current) {
        traite.current = true;
        setEtape('pret');
      }
    });

    const minuteur = setTimeout(() => {
      if (!traite.current) setEtape('invalide');
    }, DELAI_VERIFICATION);

    return () => {
      sub.remove();
      clearTimeout(minuteur);
    };
  }, [ouvrirSession]);

  const enregistrer = async () => {
    if (motDePasse.trim().length < 6) {
      setMessage(t('auth.resetTooShort'));
      return;
    }
    setOccupe(true);
    const { error } = await updatePassword(motDePasse);
    setOccupe(false);
    if (error) {
      setMessage(t('auth.resetFailed'));
      return;
    }
    setMessage(null);
    setEtape('enregistre');
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <ThemedText style={styles.emoji}>🌙</ThemedText>

          {etape === 'verification' ? (
            <>
              <ThemedText type="title" style={styles.title}>
                {t('auth.resetTitle')}
              </ThemedText>
              <ThemedText style={styles.paragraph}>{t('auth.resetChecking')}</ThemedText>
            </>
          ) : null}

          {etape === 'invalide' ? (
            <>
              <ThemedText type="title" style={styles.title}>
                {t('auth.resetInvalidTitle')}
              </ThemedText>
              <ThemedText style={styles.paragraph}>{t('auth.resetInvalidBody')}</ThemedText>
              <Pressable
                onPress={() => router.replace('/settings')}
                accessibilityRole="button"
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}>
                <ThemedText style={styles.primaryLabel}>{t('auth.resetGoSettings')}</ThemedText>
              </Pressable>
            </>
          ) : null}

          {etape === 'pret' ? (
            <>
              <ThemedText type="title" style={styles.title}>
                {t('auth.resetTitle')}
              </ThemedText>
              <ThemedText style={styles.paragraph}>{t('auth.resetIntro')}</ThemedText>
              <TextInput
                value={motDePasse}
                onChangeText={setMotDePasse}
                placeholder={t('auth.newPassword')}
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                style={[
                  styles.input,
                  { backgroundColor: theme.backgroundElement, color: theme.text },
                ]}
              />
              {message ? <ThemedText style={styles.erreur}>{message}</ThemedText> : null}
              <Pressable
                disabled={occupe}
                onPress={enregistrer}
                accessibilityRole="button"
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}>
                <ThemedText style={styles.primaryLabel}>{t('auth.updatePassword')}</ThemedText>
              </Pressable>
            </>
          ) : null}

          {etape === 'enregistre' ? (
            <>
              <ThemedText type="title" style={styles.title}>
                {t('auth.resetDoneTitle')}
              </ThemedText>
              <ThemedText style={styles.paragraph}>{t('auth.resetDoneBody')}</ThemedText>
              <Pressable
                onPress={() => router.replace('/')}
                accessibilityRole="button"
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}>
                <ThemedText style={styles.primaryLabel}>{t('notFound.cta')}</ThemedText>
              </Pressable>
            </>
          ) : null}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four },
  content: { flex: 1, justifyContent: 'center', gap: Spacing.three },
  emoji: { fontSize: 52, textAlign: 'center' },
  title: { fontSize: 30, lineHeight: 38, textAlign: 'center' },
  paragraph: { fontSize: 16, lineHeight: 26, color: CREAM, textAlign: 'center' },
  input: {
    height: 46,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.one,
  },
  erreur: { color: '#e5484d', textAlign: 'center' },
  primaryBtn: {
    backgroundColor: CREAM,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  primaryLabel: { color: GREEN, fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.8 },
});
