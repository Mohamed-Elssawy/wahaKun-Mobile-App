// Import tokens from here, never hard-code them. ESLint enforces colours and fontFamily.

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
