import { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';

// Ciel étoilé animé : fond vert nuit, étoiles qui scintillent et, environ
// toutes les 10 secondes, une étoile filante qui traverse l'écran en
// diagonale. Composant décoratif, à placer en fond (position absolue).

const SKY = '#083D2C'; // vert nuit profond
const STAR = '#FBF3DD'; // crème (comme les pages du livre)
const SHOOT = '#FFFFFF'; // étoile filante : blanc pur
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

// Trois « profils » d'étoiles filantes qui se relaient en boucle : chacune a
// sa bande de départ, son angle, sa longueur, sa vitesse et sa taille — pour
// que ce ne soit jamais la même.
const VARIANTS = [
  { xBand: [0.02, 0.35], yBand: [0.05, 0.14], angle: 0.3, len: 0.9, dur: 1300, scale: 1.05 },
  { xBand: [0.3, 0.6], yBand: [0.16, 0.26], angle: 0.46, len: 0.62, dur: 950, scale: 0.8 },
  { xBand: [0.1, 0.4], yBand: [0.24, 0.36], angle: 0.2, len: 0.98, dur: 1550, scale: 1.2 },
];

function ShootingStar() {
  const { width, height } = Dimensions.get('window');
  // Valeurs pilotées directement (pas de state) pour éviter tout décalage.
  const tx = useRef(new Animated.Value(-300)).current;
  const ty = useRef(new Animated.Value(-300)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    let index = 0;
    let first = true;

    const run = () => {
      // Première apparition rapide (~2 s), puis ~une toutes les 10 s.
      const delay = first ? 2000 : 9200 + Math.random() * 700;
      first = false;
      timer = setTimeout(() => {
        if (!active) return;
        const v = VARIANTS[index];
        index = (index + 1) % VARIANTS.length; // 0 → 1 → 2 → 0 …
        const x0 = width * (v.xBand[0] + Math.random() * (v.xBand[1] - v.xBand[0]));
        const y0 = height * (v.yBand[0] + Math.random() * (v.yBand[1] - v.yBand[0]));
        const len = Math.hypot(width, height) * v.len;
        tx.setValue(x0);
        ty.setValue(y0);
        scale.setValue(v.scale);
        rot.setValue(v.angle);
        opacity.setValue(0);
        Animated.parallel([
          Animated.timing(tx, {
            toValue: x0 + Math.cos(v.angle) * len,
            duration: v.dur,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(ty, {
            toValue: y0 + Math.sin(v.angle) * len,
            duration: v.dur,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: v.dur - 360,
              delay: 190,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => {
          if (active) run();
        });
      }, delay);
    };

    run();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [width, height, tx, ty, opacity, scale, rot]);

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

export function StarrySky() {
  const stars = useMemo(() => makeStars(60, 424242), []);
  return (
    <View style={styles.sky} pointerEvents="none">
      {stars.map((cfg, i) => (
        <Star key={i} cfg={cfg} />
      ))}
      <ShootingStar />
    </View>
  );
}

const styles = StyleSheet.create({
  sky: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SKY,
    overflow: 'hidden',
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
