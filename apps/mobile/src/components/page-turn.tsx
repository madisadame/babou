import { useRouter } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AccessibilityInfo, Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';

// Retour à l'accueil : une liasse de pages qui se tournent.
//
// Déroulé — l'ordre compte pour éviter tout scintillement :
//   1. la liasse de pages est montée et couvre tout l'écran ;
//   2. la navigation vers l'accueil a lieu DERRIÈRE elle, invisible ;
//   3. les pages se tournent une à une et découvrent l'accueil déjà en place ;
//   4. la liasse est démontée.
//
// Durée totale bornée à ~1,2 s, sous la limite de 2 s demandée : au-delà,
// une transition cesse d'être agréable et devient une attente.

const CREAM = '#F5EEDA';
const CREAM_DIM = '#E8DFC4';

// Largeurs des lignes de texte suggérées, en % de la page. L'irrégularité
// imite un paragraphe et rend la rotation lisible.
const LIGNES = [88, 94, 72, 90, 84, 96, 66, 92, 80, 88, 74, 90];

const NB_PAGES = 7;
const DUREE_PAGE = 520; // durée de rotation d'une page
// Décalage court devant la durée d'une page : les rotations se CHEVAUCHENT,
// si bien que quatre à cinq feuillets sont en mouvement simultanément. Avec un
// décalage long, les pages se relayaient une à une et l'écran restait couvert
// par un feuillet immobile pendant l'essentiel de l'animation.
const DECALAGE = 85;
// 520 + 6 x 85 = 1030 ms
const DUREE_TOTALE = DUREE_PAGE + (NB_PAGES - 1) * DECALAGE;

type PageTurnContextValue = {
  /** Rejoue l'accueil avec l'animation de pages tournées. */
  turnHome: () => void;
};

const PageTurnContext = createContext<PageTurnContextValue | null>(null);

export function PageTurnProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [actif, setActif] = useState(false);
  // Une valeur unique pilote toutes les pages ; chacune n'en lit qu'un segment.
  const avancement = useRef(new Animated.Value(0)).current;
  const enCours = useRef(false);

  const turnHome = useCallback(() => {
    if (enCours.current) return; // ignore les appuis répétés
    enCours.current = true;

    const naviguer = () => {
      router.replace('/');
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduit) => {
        // Mouvement réduit demandé par l'utilisateur : on va droit au but.
        if (reduit) {
          naviguer();
          enCours.current = false;
          return;
        }

        avancement.setValue(0);
        setActif(true);

        // La navigation se fait derrière le voile déjà monté : l'accueil est
        // en place avant que la première page ne se soulève.
        requestAnimationFrame(() => {
          naviguer();
          Animated.timing(avancement, {
            toValue: 1,
            duration: DUREE_TOTALE,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }).start(() => {
            setActif(false);
            enCours.current = false;
          });
        });
      });
  }, [avancement, router]);

  const value = useMemo<PageTurnContextValue>(() => ({ turnHome }), [turnHome]);

  return (
    <PageTurnContext.Provider value={value}>
      {children}
      {actif ? <Liasse avancement={avancement} /> : null}
    </PageTurnContext.Provider>
  );
}

// Les pages empilées, rendues au-dessus de tout le reste.
function Liasse({ avancement }: { avancement: Animated.Value }) {
  const { width, height } = Dimensions.get('window');

  return (
    <View style={styles.voile} pointerEvents="auto" accessibilityElementsHidden>
      {Array.from({ length: NB_PAGES }, (_, i) => {
        // Chaque page occupe sa propre fenêtre temporelle dans [0, 1].
        const debut = (i * DECALAGE) / DUREE_TOTALE;
        const fin = (i * DECALAGE + DUREE_PAGE) / DUREE_TOTALE;

        // Rotation autour du bord GAUCHE : RN n'a pas de transformOrigin, on
        // décale donc l'axe, on tourne, puis on remet en place.
        const rotation = avancement.interpolate({
          inputRange: [0, debut, fin, 1],
          outputRange: ['0deg', '0deg', '-180deg', '-180deg'],
        });

        // Léger assombrissement pendant que la page se relève : donne du
        // relief et évite un aplat de crème uniforme.
        const opacite = avancement.interpolate({
          inputRange: [0, debut, (debut + fin) / 2, fin, 1],
          outputRange: [1, 1, 0.94, 0.88, 0.88],
        });

        return (
          <Animated.View
            key={i}
            style={[
              styles.page,
              {
                width,
                height,
                // La page qui se tourne EN PREMIER doit être celle du DESSUS.
                // Sans ce zIndex décroissant, l'ordre de rendu la plaçait en
                // dessous : les six premières tournaient sous un feuillet
                // immobile qui masquait tout, et l'animation semblait figée.
                zIndex: NB_PAGES - i,
                backgroundColor: i % 2 === 0 ? CREAM : CREAM_DIM,
                opacity: opacite,
                transform: [
                  // Perspective courte : sans elle, la rotation se lit comme un
                  // simple écrasement horizontal et non comme une page qui se
                  // soulève.
                  { perspective: width * 1.6 },
                  { translateX: -width / 2 },
                  { rotateY: rotation },
                  { translateX: width / 2 },
                ],
              },
            ]}>
            {/* Reliure : le bord relié du livre, côté gauche. */}
            <View style={styles.reliure} />
            {/* Lignes de texte suggérées : sans elles, les pages sont des
                aplats identiques et le mouvement devient invisible — l'œil n'a
                aucun repère pour percevoir la rotation. */}
            <View style={styles.lignes} pointerEvents="none">
              {LIGNES.map((largeur, n) => (
                <View key={n} style={[styles.ligne, { width: `${largeur}%` }]} />
              ))}
            </View>
            {/* Ombre portée sur le bord libre : donne l'épaisseur de la liasse. */}
            <View style={styles.ombreBord} pointerEvents="none" />
          </Animated.View>
        );
      })}
    </View>
  );
}

export function usePageTurn(): PageTurnContextValue {
  const ctx = useContext(PageTurnContext);
  // Sans provider, on n'anime pas : l'appelant reste fonctionnel.
  return ctx ?? { turnHome: () => {} };
}

const styles = StyleSheet.create({
  voile: {
    // Transparent volontairement : les pages couvrent déjà tout l'écran, et
    // c'est en se tournant qu'elles doivent découvrir l'accueil déjà en place.
    // Un voile opaque révélait un aplat vert au lieu de la destination.
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 100,
  },
  page: {
    ...StyleSheet.absoluteFillObject,
    backfaceVisibility: 'hidden',
  },
  reliure: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: 'rgba(12, 90, 68, 0.35)',
  },
  lignes: {
    position: 'absolute',
    left: '12%',
    right: '8%',
    top: '18%',
    gap: 18,
  },
  ligne: {
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(12, 90, 68, 0.16)',
  },
  ombreBord: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 16,
    backgroundColor: 'rgba(8, 61, 44, 0.10)',
  },
});
