import type { TextStyle } from 'react-native';

/**
 * Typography tokens, pulled from the Figma file's published Text Styles.
 *
 * Weight is baked into the family name and is never expressed as `fontWeight`.
 * Android ignores `fontWeight` when an explicit PostScript family is set, so
 * `Cairo-Regular` + `fontWeight: '600'` renders Regular there and SemiBold on
 * iOS. Naming the face is the only form that renders correctly on both.
 */

export const fonts = {
  /** Headings. Figma uses SemiBold (w600) for every heading level. */
  heading: 'Cairo-SemiBold',
  /** Body and label text. Plain width, not the Condensed cut. */
  regular: 'NotoSansArabic-Regular',
  /** Figma "Body/Bold" resolves to Medium (w500). */
  medium: 'NotoSansArabic-Medium',
  /** Figma "Label/Bold" resolves to SemiBold (w600). */
  semibold: 'NotoSansArabic-SemiBold',
  /** Latin wordmark only ("Waha KUN" on the splash/welcome screen). */
  latin: 'Lora-Regular',
} as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 40,
} as const;

/**
 * Ready-made text styles. `Headings/*`, `Body/*` and `Label/*` map directly to
 * the Figma style names.
 *
 * Body and Label are distinct roles at the same sizes: Body is loose
 * (~1.75 line-height) for running text, Label is tight (1.5) for form labels
 * and UI chrome. That is why both 14/21 and 14/24.5 exist.
 */
export const textStyles = {
  h1: { fontFamily: fonts.heading, fontSize: 40, lineHeight: 50 },
  h2: { fontFamily: fonts.heading, fontSize: 32, lineHeight: 40 },
  h3: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 30 },
  h4: { fontFamily: fonts.heading, fontSize: 18, lineHeight: 22.5 },
  h5: { fontFamily: fonts.heading, fontSize: 16, lineHeight: 20 },
  h6: { fontFamily: fonts.heading, fontSize: 14, lineHeight: 17.5 },

  body12: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 21 },
  body12Bold: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 21 },
  body14: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 24.5 },
  body14Bold: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 24.5 },
  body16: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 28 },
  body16Bold: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 28 },

  // Figma has Label/12px/Regular at lineHeight 12, breaking the 1.5 ratio every
  // other Label level follows. Treated as a slip in the file and normalised.
  label12: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18 },
  label12Bold: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 18 },
  label14: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21 },
  label14Bold: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 21 },
  label16: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24 },
  label16Bold: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 24 },
  label20: { fontFamily: fonts.regular, fontSize: 20, lineHeight: 30 },
  label20Bold: { fontFamily: fonts.semibold, fontSize: 20, lineHeight: 30 },
} as const satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof textStyles;
