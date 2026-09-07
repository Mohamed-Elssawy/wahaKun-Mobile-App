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

  // The vision service sends SeverityLevel.value, so these are what the server actually stores.
  'حرجة جداً': 'critical',
  حرجة: 'critical',
  'عالية جداً': 'critical',
  عالية: 'critical',

  متوسطة: 'medium',

  منخفضة: 'low',
  بسيطة: 'low',
  'بسيطة جداً': 'low',
  'غير مؤثرة': 'low',

  'غير معروفة': 'unknown',
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

/** Takes a bare string: `severity` is a C# string, so the server can send a step this file lacks. */
export function describeSeverity(severity: string): SeverityDisplay {
  return TIER_DISPLAY[SEVERITY_TIERS[severity as Severity] ?? 'unknown'];
}

/** True for the tier the حرج filter shows, so filter and badge agree by construction. */
export function isCriticalSeverity(severity: string): boolean {
  return SEVERITY_TIERS[severity as Severity] === 'critical';
}
