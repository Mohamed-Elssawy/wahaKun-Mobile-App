/**
 * The design system's public surface, derived from the Figma file. Import
 * tokens from here rather than hard-coding a colour, font, size, radius or
 * spacing value; ESLint enforces the colour and fontFamily halves of that rule
 * (see no-restricted-syntax in .eslintrc.js).
 */

export { colors, palette } from './colors';
export type { ColorToken } from './colors';

export { fonts, fontSizes, textStyles } from './typography';
export type { TextVariant } from './typography';

export { spacing, radii, shadows, screenPadding, controlHeight } from './layout';

import { colors, palette } from './colors';
import { controlHeight, radii, screenPadding, shadows, spacing } from './layout';
import { fonts, fontSizes, textStyles } from './typography';

/** Aggregate, for passing the whole theme as one object. */
export const theme = {
  colors,
  palette,
  fonts,
  fontSizes,
  textStyles,
  spacing,
  radii,
  shadows,
  screenPadding,
  controlHeight,
} as const;

export type Theme = typeof theme;
