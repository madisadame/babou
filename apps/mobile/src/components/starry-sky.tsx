import { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Mask } from 'react-native-svg';

// Ciel étoilé animé : fond vert nuit, étoiles qui scintillent et, environ
// toutes les 10 secondes, une étoile filante qui traverse l'écran en
// diagonale. Composant décoratif, à placer en fond (position absolue).

const SKY = '#083D2C'; // vert nuit profond
const STAR = '#FBF3DD'; // crème (comme les pages du livre)
const SHOOT = '#FFFFFF'; // étoile filante : blanc pur
const MOON = '#F4EFDF'; // clair de lune (crème doux)
const MOON_D = 72; // diamètre du croissant de lune
const ANGLE = 0.36; // ~21° sous l'horizontale, direction de l'étoile filante
const BOX_W = 168; // longueur de la traînée (conteneur dimensionné)
const BOX_H = 10;

// RNG déterministe : le champ d'étoiles reste stable entre les rendus.
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

type StarCfg = {
  top: number;
  left: number;
  size: number;
  min: number;
  max: number;
  duration: number;
  delay: number;
};

function makeStars(count: number, seed: number): StarCfg[] {
  const rnd = seeded(seed);
  return Array.from({ length: count }, () => ({
    top: rnd() * 100,
    left: rnd() * 100,
    size: 1 + rnd() * 2.6,
    min: 0.15 + rnd() * 0.25,
    max: 0.7 + rnd() * 0.3,
    duration: 1100 + rnd() * 2600,
    delay: rnd() * 3000,
  }));
}

function Star({ cfg }: { cfg: StarCfg }) {
  const opacity = useRef(new Animated.Value(cfg.min)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: cfg.max,
          duration: cfg.duration,
          delay: cfg.delay,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: cfg.min,
          duration: cfg.duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [cfg, opacity]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: `${cfg.top}%`,
        left: `${cfg.left}%`,
        width: cfg.size,
        height: cfg.size,
        borderRadius: cfg.size / 2,
        backgroundColor: STAR,
        opacity,
      }}
    />
  );
}

// Profil d'une étoile filante : zone verticale de départ (yBand), direction
// horizontale (dir : +1 vers la droite, -1 vers la gauche), inclinaison
// (angle : >0 descend, <0 monte), longueur, durée et taille.
type Profile = {
  yBand: [number, number];
  dir: 1 | -1;
  angle: number;
  len: number;
  dur: number;
  scale: number;
};

// Cinq trajectoires réparties sur l'écran : haut, milieu (droite + gauche),
// bas (droite + gauche). Chaque étoile se déclenche à un rythme ALÉATOIRE
// et indépendant des autres.
const PROFILES: Profile[] = [
  { yBand: [0.05, 0.16], dir: 1, angle: 0.34, len: 0.85, dur: 1300, scale: 1.05 },
  { yBand: [0.4, 0.52], dir: 1, angle: 0.16, len: 0.82, dur: 1150, scale: 0.98 },
  { yBand: [0.4, 0.52], dir: -1, angle: 0.16, len: 0.82, dur: 1150, scale: 0.98 },
  { yBand: [0.7, 0.82], dir: 1, angle: -0.12, len: 0.78, dur: 1250, scale: 0.86 },
  { yBand: [0.7, 0.82], dir: -1, angle: -0.12, len: 0.78, dur: 1250, scale: 0.86 },
];

function ShootingStar({ profile }: { profile: Profile }) {
  const { width, height } = Dimensions.get('window');
  // Valeurs pilotées directement (pas de state) pour éviter tout décalage.
  const tx = useRef(new Animated.Value(-400)).current;
  const ty = useRef(new Animated.Value(-400)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    const run = (initial: boolean) => {
      // Rythme aléatoire et indépendant : première apparition dans 1–13 s,
      // puis une nouvelle 8–22 s plus tard, à chaque fois au hasard.
      const delay = initial ? 1000 + Math.random() * 12000 : 8000 + Math.random() * 14000;
      timer = setTimeout(() => {
        if (!active) return;
        const { yBand, dir, angle, len, dur, scale: sc } = profile;
        const lenPx = Math.hypot(width, height) * len;
        // départ du bon côté selon la direction, pour bien traverser l'écran
        const x0 =
          dir > 0
            ? width * (0.02 + Math.random() * 0.26)
            : width * (0.72 + Math.random() * 0.26);
        const y0 = height * (yBand[0] + Math.random() * (yBand[1] - yBand[0]));
        const vx = dir * Math.cos(angle) * lenPx;
        const vy = Math.sin(angle) * lenPx;
        const theta = Math.atan2(vy, vx); // orientation de la traînée
        tx.setValue(x0);
        ty.setValue(y0);
        scale.setValue(sc);
        rot.setValue(theta);
        opacity.setValue(0);
        Animated.parallel([
          Animated.timing(tx, {
            toValue: x0 + vx,
            duration: dur,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(ty, {
            toValue: y0 + vy,
            duration: dur,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: dur - 360,
              delay: 190,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => {
          if (active) run(false);
        });
      }, delay);
    };

    run(true);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [profile, width, height, tx, ty, opacity, scale, rot]);

  const rotate = rot.interpolate({ inputRange: [0, 1], outputRange: ['0rad', '1rad'] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: BOX_W,
        height: BOX_H,
        opacity,
        transform: [{ translateX: tx }, { translateY: ty }, { rotateZ: rotate }, { scale }],
      }}>
      <View style={styles.trailGlow} />
      <View style={styles.trail} />
      <View style={styles.head} />
    </Animated.View>
  );
}

// Croissant de lune fin (~3 jours) en haut à droite. Dessiné avec un masque
// SVG : seule la partie éclairée (crème) est peinte ; le reste est
// transparent (pas de disque sombre, les étoiles passent derrière).
// R = rayon ; DX/DY = décalage du cercle de découpe → plus DX est petit,
// plus le croissant est fin.
const MOON_R = MOON_D / 2;
const MOON_DX = 8; // finesse du croissant
const MOON_DY = -4; // légère inclinaison

function Moon() {
  const breath = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: 4200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: 4200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breath]);

  const opacity = breath.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] });

  return (
    <Animated.View style={[styles.moonWrap, { opacity }]} pointerEvents="none">
      <Svg width={MOON_D} height={MOON_D}>
        <Defs>
          <Mask id="crescent">
            <Circle cx={MOON_R} cy={MOON_R} r={MOON_R} fill="#fff" />
            <Circle cx={MOON_R + MOON_DX} cy={MOON_R + MOON_DY} r={MOON_R} fill="#000" />
          </Mask>
        </Defs>
        <Circle cx={MOON_R} cy={MOON_R} r={MOON_R} fill={MOON} mask="url(#crescent)" />
      </Svg>
    </Animated.View>
  );
}

export function StarrySky() {
  const stars = useMemo(() => makeStars(60, 424242), []);
  return (
    <View style={styles.sky} pointerEvents="none">
      {stars.map((cfg, i) => (
        <Star key={i} cfg={cfg} />
      ))}
      <Moon />
      {PROFILES.map((profile, i) => (
        <ShootingStar key={i} profile={profile} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sky: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SKY,
    overflow: 'hidden',
  },
  // croissant de lune, en haut à droite (lueur douce épousant le croissant)
  moonWrap: {
    position: 'absolute',
    top: 64,
    right: 36,
    width: MOON_D,
    height: MOON_D,
    shadowColor: MOON,
    shadowOpacity: 0.45,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 0 },
  },
  // halo diffus sur toute la longueur de la traînée
  trailGlow: {
    position: 'absolute',
    left: 0,
    top: BOX_H / 2 - 4,
    width: BOX_W,
    height: 8,
    borderRadius: 4,
    backgroundColor: SHOOT,
    opacity: 0.16,
  },
  // traînée fine et lumineuse (la tête est au bout droit)
  trail: {
    position: 'absolute',
    left: 4,
    top: BOX_H / 2 - 1.5,
    width: BOX_W - 12,
    height: 3,
    borderRadius: 2,
    backgroundColor: SHOOT,
    opacity: 0.8,
  },
  // tête brillante au bout droit de la traînée
  head: {
    position: 'absolute',
    right: 0,
    top: BOX_H / 2 - 4.5,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: SHOOT,
  },
});
