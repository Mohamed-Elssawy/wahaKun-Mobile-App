import type { TextStyle } from 'react-native';

// Android ignores fontWeight when a PostScript family is set, so weight lives in the name.
export const fonts = {
  /** Figma uses SemiBold for every heading level. */
  heading: 'Cairo-SemiBold',
  /** Plain width, not the Condensed cut. */
  regular: 'NotoSansArabic-Regular',
  /** Figma "Body/Bold" resolves to Medium. */
  medium: 'NotoSansArabic-Medium',
  /** Figma "Label/Bold" resolves to SemiBold. */
  semibold: 'NotoSansArabic-SemiBold',
  /** The Latin wordmark only. */
  latin: 'Lora-Regular',
  /** The wordmark's weight everywhere it appears in the new Figma. */
  latinStrong: 'Lora-SemiBold',
} as const;

// Body is loose for running text, Label is tight for UI chrome. Both exist at 14px.
export const textStyles = {
  h1: { fontFamily: fonts.heading, fontSize: 40, lineHeight: 50 },
  h2: { fontFamily: fonts.heading, fontSize: 32, lineHeight: 40 },
  h3: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 40 },
  h4: { fontFamily: fonts.heading, fontSize: 18, lineHeight: 30 },
  h5: { fontFamily: fonts.heading, fontSize: 16, lineHeight: 24 },
  h6: { fontFamily: fonts.heading, fontSize: 14, lineHeight: 17.5 },

  body12: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 21 },
  body12Bold: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 21 },
  body14: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 24.5 },
  body14Bold: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 24.5 },
  body16: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 28 },
  body16Bold: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 28 },

  // Figma has Label/12 at lineHeight 12, breaking the 1.5 ratio, so it is normalised here.
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
