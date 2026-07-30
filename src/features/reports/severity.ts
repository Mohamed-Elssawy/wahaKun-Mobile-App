import type { ColorToken } from '@/theme';

import type { Severity } from './types';

// Ten levels onto green, amber, red. Blue is skipped: it reads as info, not danger.
// Unknown is grey, because "we could not tell" is not the claim "it is fine".
export const SEVERITY_COLORS: Record<Severity, ColorToken> = {
  Unknown: 'disabled',
  Negligible: 'success',
  VeryMinor: 'success',
  Minor: 'success',
  Low: 'warning',
  Medium: 'warning',
  High: 'error',
  VeryHigh: 'error',
  Critical: 'error',
  VeryCritical: 'error',
};

/** Severity levels the farmer is warned about, used by the حرج filter. */
export const CRITICAL_SEVERITIES: Severity[] = ['Critical', 'VeryCritical'];

// The server sends the English enum name, so the Arabic is produced here.
// Masculine, to agree with مستوى beside the badge: Critical is حرج, not حرجة.
export const SEVERITY_LABELS: Record<Severity, string> = {
  Unknown: 'غير معروف',
  Negligible: 'ضئيل',
  VeryMinor: 'بسيط جداً',
  Minor: 'بسيط',
  Low: 'منخفض',
  Medium: 'متوسط',
  // "مرتفع" not "عالٍ": that tanween renders inconsistently across the Noto cuts.
  High: 'مرتفع',
  VeryHigh: 'مرتفع جداً',
  Critical: 'حرج',
  VeryCritical: 'حرج جداً',
};
