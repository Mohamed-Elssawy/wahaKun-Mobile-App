/**
 * Spacing, radii, shadows and control sizing.
 *
 * Measured across the Figma file rather than assumed from a 4pt grid. `10` is
 * the most common gap in this design (955 uses), so the scale keeps it as `ms`
 * instead of rounding it to 8 or 12.
 */

import { colors } from './colors';

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
  /** Fully rounded — pills, avatars, circular icon buttons. */
  pill: 100,
} as const;

/** Standard horizontal padding for a screen's content. */
export const screenPadding = spacing.xl; // 24

/** Height of a primary control (button, text input, select). */
export const controlHeight = 48;

/**
 * Figma layers two drop shadows (a tight 0/2/4 at 8% over a soft 0/8/16 at 4%).
 * React Native supports one shadow per view on iOS and only `elevation` on
 * Android, so each token approximates the pair with its dominant layer.
 */
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
  /** Bottom sheets — Figma inverts the offset so the shadow casts upward. */
  sheet: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 8,
  },
} as const;
