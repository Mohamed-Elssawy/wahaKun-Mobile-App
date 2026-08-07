import { colors } from './colors';

/**
 * The spacing ramp. 2pt base — every value the Figma file actually uses is even,
 * so this was always a system, it had just never been written down.
 *
 * 2, 4      intra-component nudges
 * 8, 10, 12 gaps between elements
 * 16        grouped content
 * 24        the screen gutter (`screenPadding`)
 * 32, 40    section breaks
 *
 * A value not on this ramp is a bug. Keys are the values themselves so the
 * Figma variables (`space/10`) and the code cannot drift apart — the same
 * discipline `textStyles` already follows with `body12` / `label16`, and the
 * absence of which is how a Figma style named `Body/Bold` ended up resolving to
 * Medium.
 */
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
} as const;

export const radii = {
  4: 4,
  6: 6,
  12: 12,
  16: 16,
  20: 20,
  /** Fully rounded, for pills and avatars. Not a scale step. */
  pill: 100,
} as const;

export const screenPadding = spacing[24];

/**
 * Minimum height for tappable controls — clears the Android 48dp target.
 * A *minimum*, not a fixed height: at large OS font sizes a fixed 48 clips the
 * label, and the users most likely to have raised their font size are the ones
 * this app is for.
 */
export const controlHeight = 48;

/**
 * Ceiling on OS font scaling. RN scales text unbounded by default, which breaks
 * any layout with a bounded row. 1.3 keeps the largest common Android setting
 * legible without letting a 2x setting destroy the screen.
 */
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
