import { colors } from './colors';

// 2pt ramp; a value off it is a bug. Keys are the values so Figma's `space/10` matches.
export const spacing = {
  0: 0,
  2: 2,
  4: 4,
  8: 8,
  10: 10,
  12: 12,
  16: 16,
  24: 24,
  32: 32,
  40: 40,
  56: 56,
} as const;

export const radii = {
  4: 4,
  6: 6,
  /** OTP input blocks, and nothing else so far. */
  10: 10,
  12: 12,
  16: 16,
  20: 20,
  /** Fully rounded, for pills and avatars. Not a scale step. */
  pill: 100,
} as const;

export const screenPadding = spacing[24];

/** Android's 48dp target. A minimum, not a fixed height: a fixed 48 clips large OS fonts. */
export const controlHeight = 48;

/** RN scales text unbounded by default, which breaks any layout with a bounded row. */
export const maxFontScale = 1.3;

// Figma layers two shadows; RN supports one, so each token keeps the dominant layer.
export const shadows = {
  card: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  raised: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 6,
  },
  /** Figma inverts the offset here so the shadow casts upward. */
  sheet: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 8,
  },
} as const;
