/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// Palette « nuit » de Babou : toute l'app vit sur le ciel étoilé (voir
// StarrySky). Les fonds sont transparents pour laisser passer le ciel, les
// textes sont crème et les surfaces (cartes, champs) en blanc translucide.
// Un seul thème : l'identité de Babou est nocturne (plus de mode clair/sombre).
const night = {
  text: '#F5EEDA',
  background: 'transparent',
  backgroundElement: 'rgba(255, 255, 255, 0.09)',
  backgroundSelected: 'rgba(255, 255, 255, 0.17)',
  textSecondary: 'rgba(245, 238, 218, 0.68)',
} as const;

export const Colors = {
  light: night,
  dark: night,
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
