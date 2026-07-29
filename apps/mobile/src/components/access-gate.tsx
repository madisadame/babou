import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { useAccess } from '@/hooks/use-access';

// Écrans accessibles même quand l'accès est bloqué, pour que l'utilisateur
// puisse agir : le paywall lui-même, les réglages (se connecter / déconnecter /
// restaurer un achat) et le soutien (don). Tout le reste (contenu) est bloqué.
const ALLOWED_WHEN_BLOCKED = ['paywall', 'settings', 'support'];

// Redirige vers le paywall quand l'accès est bloqué, et en sort dès qu'il est
// rétabli. Ne rend rien : c'est une garde de navigation.
export function AccessGate() {
  const { hasAccess, loading } = useAccess();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const root = segments[0] ?? '';
    if (!hasAccess) {
      if (!ALLOWED_WHEN_BLOCKED.includes(root)) router.replace('/paywall');
    } else if (root === 'paywall') {
      router.replace('/');
    }
  }, [hasAccess, loading, segments, router]);

  return null;
}
