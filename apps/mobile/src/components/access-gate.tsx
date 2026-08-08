import { usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useAccess } from '@/hooks/use-access';
import { useShowcase } from '@/hooks/use-showcase';

// Écrans accessibles même quand l'accès est bloqué, pour que l'utilisateur
// puisse gérer son compte : le paywall lui-même, les réglages (connexion /
// déconnexion / restauration / suppression de compte), le profil, et l'écran
// de réinitialisation de mot de passe (atteint depuis un lien d'e-mail, donc
// forcément hors session).
const ALLOWED_WHEN_BLOCKED = ['paywall', 'settings', 'profile', 'reset-password'];

// Écrans de découverte : l'accueil et la bibliothèque restent ouverts pour que
// le visiteur puisse atteindre le livre vitrine. Il n'y verra que celui-ci —
// la RLS filtre le reste du catalogue côté base, pas seulement à l'affichage.
const DISCOVERY = ['', 'library'];

// Redirige vers le paywall quand l'accès est bloqué, et en sort dès qu'il est
// rétabli. Ne rend rien : c'est une garde de navigation.
export function AccessGate() {
  const { hasAccess, loading } = useAccess();
  const { bookIds, chapterIds, loading: showcaseLoading } = useShowcase();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Tant que l'accès OU la vitrine sont inconnus, ne rien décider : rediriger
    // trop tôt renverrait un visiteur légitime de la vitrine vers le paywall.
    if (loading || showcaseLoading) return;

    // `usePathname` donne les valeurs réelles ('/book/introduction-l4j20'), là
    // où `useSegments` ne donnerait que les motifs ('book', '[id]') — on a
    // besoin de l'identifiant pour savoir si la route vise la vitrine.
    const parts = pathname.split('/').filter(Boolean);
    const root = parts[0] ?? '';
    const param = parts[1] ?? '';

    if (hasAccess) {
      if (root === 'paywall') router.replace('/');
      return;
    }

    const allowed =
      ALLOWED_WHEN_BLOCKED.includes(root) ||
      DISCOVERY.includes(root) ||
      // Le livre vitrine et tout ce qu'il contient.
      (root === 'book' && bookIds.has(param)) ||
      (root === 'final-quiz' && bookIds.has(param)) ||
      ((root === 'chapter' || root === 'quiz') && chapterIds.has(param));

    if (!allowed) router.replace('/paywall');
  }, [hasAccess, loading, showcaseLoading, bookIds, chapterIds, pathname, router]);

  return null;
}
