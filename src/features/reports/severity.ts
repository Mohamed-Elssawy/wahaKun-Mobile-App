import type { ColorToken } from '@/theme';

import type { Severity } from './types';

/** The backend's ten `SeverityLevel` steps collapsed to what a farmer acts on. */
export type SeverityTier = 'critical' | 'medium' | 'low' | 'unknown';

// High and VeryHigh sit in `critical`: under-warning about a damaged pipe costs more.
const SEVERITY_TIERS: Record<Severity, SeverityTier> = {
  VeryCritical: 'critical',
  Critical: 'critical',
  VeryHigh: 'critical',
  High: 'critical',

  Medium: 'medium',

  Low: 'low',
  Minor: 'low',
  VeryMinor: 'low',
  Negligible: 'low',

  // Not "it is fine": the model could not tell, which is its own answer.
  Unknown: 'unknown',
};

export type SeverityDisplay = {
  /** Feminine, agreeing with الخطورة in "مستوى الخطورة". */
  label: string;
  /** The filled badge and the row's severity stripe. */
  color: ColorToken;
  /** Same hue at text weight, for a label on a light surface. */
  textColor: ColorToken;
};

const TIER_DISPLAY: Record<SeverityTier, SeverityDisplay> = {
  critical: { label: 'حرجة', color: 'error', textColor: 'errorText' },
  medium: { label: 'متوسطة', color: 'warning', textColor: 'warningText' },
  low: { label: 'منخفضة', color: 'info', textColor: 'infoText' },
  unknown: { label: 'غير معروفة', color: 'disabled', textColor: 'textMuted' },
};

/** Falls back to `unknown`: the server can grow an enum value before this file does. */
export function describeSeverity(severity: Severity): SeverityDisplay {
  return TIER_DISPLAY[SEVERITY_TIERS[severity] ?? 'unknown'];
}

/** True for the tier the حرج filter shows, so filter and badge agree by construction. */
export function isCriticalSeverity(severity: Severity): boolean {
  return SEVERITY_TIERS[severity] === 'critical';
}
