// palette mirrors the Figma names 1:1; colors is the semantic layer that UI code imports.
export const palette = {
  primary: {
    G100: '#E2EEE7',
    G300: '#7DBA96',
    G500: '#1A6B3C',
    G700: '#0A4B25',
  },
  /** Sand/gold. In Figma, not used by any implemented screen yet. */
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
    /** Lightest neutral clearing 3:1 on both white and `background`. Control outlines only. */
    N550: '#8A8B8C',
    N600: '#797A7B',
    /** Lightest neutral clearing 4.5:1 on both white and `background`. De-emphasised text. */
    N650: '#6D6E6F',
    N700: '#57595A',
    N800: '#363939',
    N900: '#1F2223',
    white: '#FFFFFF',
    black: '#000000',
  },
  /** Issue severity and status ramps. */
  accent: {
    red: { R100: '#FCE1DF', R300: '#F3B7B3', R500: '#D93025', R700: '#A41B12' },
    amber: { A100: '#FFEFE0', A300: '#F7BD8A', A500: '#E67E22', A700: '#A7550E' },
    blue: { B100: '#DAECF9', B300: '#94C3E6', B500: '#1E7ABF', B700: '#0D4E7E' },
    green: { LG100: '#CEF1DD', LG300: '#8BE3B0', LG500: '#27AE60', LG700: '#05632D' },
  },
  /** A standalone style in Figma, not part of a ramp. */
  background: '#F4F1EB',
} as const;

// Text tokens clear 4.5:1 on both surfaces; the 500 stops are fills and fail as text.
export const colors = {
  primary: palette.primary.G500,
  primaryPressed: palette.primary.G700,
  primaryMuted: palette.primary.G300,
  primaryTint: palette.primary.G100,
  /** G700 as a static fill, not a press state: intro CTA, selected role card, OTP digit. */
  primaryStrong: palette.primary.G700,

  background: palette.background,
  surface: palette.neutral.white,
  surfaceMuted: palette.neutral.N100,
  overlay: 'rgba(0, 0, 0, 0.4)',

  textPrimary: palette.neutral.N900,
  textStrong: palette.neutral.N800,
  textSecondary: palette.neutral.N700,
  textMuted: palette.neutral.N650,
  /** Placeholders are not exempt from 1.4.3; they carry instructions here. */
  textPlaceholder: palette.neutral.N650,
  /** Genuinely inactive controls only, which 1.4.3 exempts. Never for tappable text. */
  textDisabled: palette.neutral.N400,
  textInverse: palette.neutral.white,

  /** Decorative edges: dividers, card hairlines. Not covered by 1.4.11. */
  border: palette.neutral.N200,
  borderStrong: palette.neutral.N300,
  /** 1.4.11 needs 3:1 here, since the border is the only thing marking it as a control. */
  borderControl: palette.neutral.N550,
  /** Card hairlines. Decorative: the white fill, not this edge, is what marks a card. */
  borderCard: palette.neutral.N400,
  divider: palette.neutral.N200,

  disabled: palette.neutral.N400,

  /** Fills, icons and severity dots. */
  error: palette.accent.red.R500,
  warning: palette.accent.amber.A500,
  info: palette.accent.blue.B500,
  success: palette.accent.green.LG500,

  errorTint: palette.accent.red.R100,
  warningTint: palette.accent.amber.A100,
  infoTint: palette.accent.blue.B100,
  successTint: palette.accent.green.LG100,

  /** Status as text. The 700 stops clear 4.5:1 on white and on their own tint. */
  errorText: palette.accent.red.R700,
  warningText: palette.accent.amber.A700,
  infoText: palette.accent.blue.B700,
  successText: palette.accent.green.LG700,

  shadow: palette.neutral.black,
} as const;

export type ColorToken = keyof typeof colors;
