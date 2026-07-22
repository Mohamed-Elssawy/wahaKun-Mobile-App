/**
 * Colour tokens, pulled from the Figma file's published Color Styles
 * (file w21eONa2qJIyZ1xQXnnFbo, page "Design System").
 *
 * `palette` is the raw ramp and mirrors the Figma names 1:1 so a value can be
 * traced back to the design. `colors` is the semantic layer, and is what UI
 * code should import. Screens should almost never reach into `palette`.
 */

/** Raw ramps. Names match Figma exactly (Primary/G500, Neutral/N900, ...). */
export const palette = {
  primary: {
    G100: '#E2EEE7',
    G300: '#7DBA96',
    G500: '#1A6B3C',
    G700: '#0A4B25',
  },
  /** Sand/gold. Defined in Figma, not yet used by any implemented screen. */
  secondary: {
    S100: '#F8EEDA',
    S300: '#F5E5C5',
    S500: '#C8A96E',
  },
  neutral: {
    N100: '#F6F6F6',
    N200: '#EAEAEA',
    N300: '#D2D3D3',
    N400: '#B1B2B2',
    N500: '#8E9090',
    N600: '#797A7B',
    N700: '#57595A',
    N800: '#363939',
    N900: '#1F2223',
    white: '#FFFFFF',
    black: '#000000',
  },
  /** Issue severity / status ramps. */
  accent: {
    red: { R100: '#FCE1DF', R300: '#F3B7B3', R500: '#D93025', R700: '#A41B12' },
    amber: { A100: '#FFEFE0', A300: '#F7BD8A', A500: '#E67E22', A700: '#A7550E' },
    blue: { B100: '#DAECF9', B300: '#94C3E6', B500: '#1E7ABF', B700: '#0D4E7E' },
    green: { LG100: '#CEF1DD', LG300: '#8BE3B0', LG500: '#27AE60', LG700: '#05632D' },
  },
  /** Page background. A standalone style in Figma, not part of a ramp. */
  background: '#F4F1EB',
} as const;

/** Semantic tokens. Components consume these, not `palette`. */
export const colors = {
  primary: palette.primary.G500,
  primaryPressed: palette.primary.G700,
  primaryMuted: palette.primary.G300,
  primaryTint: palette.primary.G100,

  background: palette.background,
  surface: palette.neutral.white,
  surfaceMuted: palette.neutral.N100,
  overlay: 'rgba(0, 0, 0, 0.4)',

  textPrimary: palette.neutral.N900,
  textStrong: palette.neutral.N800,
  textSecondary: palette.neutral.N700,
  textMuted: palette.neutral.N600,
  textSubtle: palette.neutral.N500,
  textDisabled: palette.neutral.N400,
  textInverse: palette.neutral.white,
  textPlaceholder: palette.neutral.N400,

  border: palette.neutral.N200,
  borderStrong: palette.neutral.N300,
  divider: palette.neutral.N200,

  disabled: palette.neutral.N400,

  error: palette.accent.red.R500,
  errorTint: palette.accent.red.R100,
  warning: palette.accent.amber.A500,
  warningTint: palette.accent.amber.A100,
  info: palette.accent.blue.B500,
  infoTint: palette.accent.blue.B100,
  success: palette.accent.green.LG500,
  successTint: palette.accent.green.LG100,

  shadow: palette.neutral.black,
} as const;

export type ColorToken = keyof typeof colors;
