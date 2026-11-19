import { locale } from '@/i18n';
import type { Locale } from '@/i18n';

import type { TextStyle } from 'react-native';

// §16.6 as amended: headings keep Cairo in both locales, so the face is named once here.
const HEADING = 'Cairo-SemiBold';

// Android ignores fontWeight when a PostScript family is set, so weight lives in the name.
const FAMILIES = {
  ar: {
    heading: HEADING,
    regular: 'NotoSansArabic-Regular',
    medium: 'NotoSansArabic-Medium',
    semibold: 'NotoSansArabic-SemiBold',
  },
  en: {
    heading: HEADING,
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semibold: 'Inter-SemiBold',
  },
} as const;

// Addressed by SCRIPT, not locale - needed only for S-12's bilingual note, which renders both scripts together regardless of the active one (E8 req 6).
export const scriptFonts = FAMILIES;

// §16.6: family and line height follow the locale, font size never does; headings keep Cairo, so they need no per-locale scale at all.
const HEADING_LINE_HEIGHTS = { h1: 50, h2: 40, h3: 40, h4: 30 } as const;

// Body family does change (NotoSansArabic -> Inter); Arabic sits looser (~1.75) for its ascenders/descenders than Latin.
const BODY_LINE_HEIGHTS = {
  ar: { body12: 21, body14: 24.5, body16: 28 },
  en: { body12: 18, body14: 21, body16: 24 },
} as const;

// Resolved once at module init - can't be lazy, since module-scope StyleSheet.create calls would snapshot it regardless.
const script = locale();
const family = FAMILIES[script];
const lineHeight = { ...HEADING_LINE_HEIGHTS, ...BODY_LINE_HEIGHTS[script] };

export const fonts = {
  /** Figma uses SemiBold for every heading level, and §16.6 keeps Cairo's in both locales. */
  heading: family.heading,
  /** Plain width, not the Condensed cut. */
  regular: family.regular,
  /** Figma "Body/Bold" resolves to Medium. */
  medium: family.medium,
  /** Figma "Label/Bold" resolves to SemiBold. */
  semibold: family.semibold,
  /** The Latin wordmark only, and §16.6 leaves it alone in both locales. */
  latin: 'Lora-Regular',
  /** The wordmark's weight everywhere it appears in the new Figma. */
  latinStrong: 'Lora-SemiBold',
} as const;

// Body is loose for running text, Label is tight for UI chrome. Both exist at 14px.
export const textStyles = {
  h1: { fontFamily: fonts.heading, fontSize: 40, lineHeight: lineHeight.h1 },
  h2: { fontFamily: fonts.heading, fontSize: 32, lineHeight: lineHeight.h2 },
  h3: { fontFamily: fonts.heading, fontSize: 24, lineHeight: lineHeight.h3 },
  h4: { fontFamily: fonts.heading, fontSize: 18, lineHeight: lineHeight.h4 },
  h5: { fontFamily: fonts.heading, fontSize: 16, lineHeight: 24 },
  h6: { fontFamily: fonts.heading, fontSize: 14, lineHeight: 17.5 },

  body12: { fontFamily: fonts.regular, fontSize: 12, lineHeight: lineHeight.body12 },
  body12Bold: { fontFamily: fonts.medium, fontSize: 12, lineHeight: lineHeight.body12 },
  body14: { fontFamily: fonts.regular, fontSize: 14, lineHeight: lineHeight.body14 },
  body14Bold: { fontFamily: fonts.medium, fontSize: 14, lineHeight: lineHeight.body14 },
  body16: { fontFamily: fonts.regular, fontSize: 16, lineHeight: lineHeight.body16 },
  body16Bold: { fontFamily: fonts.medium, fontSize: 16, lineHeight: lineHeight.body16 },

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

// §16.6/E8: a role selects a variant; no variant ever changes size - only buttonLabel/timelineNode step up in English, since Latin reads smaller than Arabic at the same point size.
const PER_LOCALE_ROLES = {
  ar: { buttonLabel: 'h5', timelineNode: 'h5' },
  en: { buttonLabel: 'h4', timelineNode: 'h4' },
} as const satisfies Record<Locale, Record<string, TextVariant>>;

type PerLocaleRole = keyof (typeof PER_LOCALE_ROLES)['ar'];

// Roles that select the SAME variant in both locales (measured in E10 off 4x exports); the satisfies guard turns a role duplicated in PER_LOCALE_ROLES into a type error.
const SHARED_ROLES = {
  /** A ghost Button's label: X-03 and X-04's way out, S-13a's cancel. The frames draw a link. */
  ghostLabel: 'body14',
  /** Sign-in/sign-up forms label at body14; expert's case forms use Cairo 16 (TextField's default) - neither drifted, the form picks its own family. */
  authFieldLabel: 'body14',
  /** A header over a group of rows: F-07's list sections, F-04's comment count. Cairo 16. */
  sectionHeader: 'h5',
} as const satisfies Record<string, TextVariant> & Partial<Record<PerLocaleRole, never>>;

const ROLE_VARIANTS = {
  ar: { ...SHARED_ROLES, ...PER_LOCALE_ROLES.ar },
  en: { ...SHARED_ROLES, ...PER_LOCALE_ROLES.en },
} as const;

export type TextRole = keyof (typeof ROLE_VARIANTS)['ar'];

/** The active locale's roles, resolved once at module init for the same reason textStyles is. */
export const roleVariants: Readonly<Record<TextRole, TextVariant>> =
  ROLE_VARIANTS[script];

// Same table addressed by SCRIPT, for text written in the non-active language (S-12's relaunch); constant in both locales, so there's no late-resolution freeze to chase.
export const scriptRoleVariants = ROLE_VARIANTS;
