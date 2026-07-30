import { colors } from './colors';

// Measured from Figma, not a 4pt grid: 10 is the commonest gap there, so it stays as ms.
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  ms: 10,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const radii = {
  xs: 4,
  sm: 6,
  md: 12,
  lg: 16,
  xl: 20,
  /** Fully rounded, for pills and avatars. */
  pill: 100,
} as const;

export const screenPadding = spacing.xl;

export const controlHeight = 48;

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
