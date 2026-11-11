import type { ColorToken } from '@/theme';

import type { Report, Severity } from './types';

/** `IssuePriority` as the wire spells it: the coarse axis stored beside the AI severity. */
export type WirePriority = 'Low' | 'Medium' | 'High' | 'Critical';

/** What IssueService stores when the model names no severity; GetPriority reads it as Unknown. */
const UNKNOWN_SEVERITY: Severity = 'غير معروفة';

// G6: a row carries a priority but no AI severity, so the coarser axis is the fallback.
const SEVERITY_FOR_PRIORITY: Record<WirePriority, Severity> = {
  Critical: 'حرجة',
  High: 'عالية',
  Medium: 'متوسطة',
  Low: 'منخفضة',
};

export function severityFromPriority(priority: string): Severity {
  return SEVERITY_FOR_PRIORITY[priority as WirePriority] ?? UNKNOWN_SEVERITY;
}

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
  /** Which droplet SeverityBadge draws; the ten backend steps collapse to these four. */
  tier: SeverityTier;
  /** Feminine, agreeing with الخطورة in "مستوى الخطورة". */
  label: string;
  /** The filled badge and the row's severity stripe. */
  color: ColorToken;
  /** Same hue at text weight, for a label on a light surface. */
  textColor: ColorToken;
};

const TIER_DISPLAY: Record<SeverityTier, SeverityDisplay> = {
  critical: { tier: 'critical', label: 'حرجة', color: 'error', textColor: 'errorText' },
  medium: { tier: 'medium', label: 'متوسطة', color: 'warning', textColor: 'warningText' },
  low: { tier: 'low', label: 'منخفضة', color: 'info', textColor: 'infoText' },
  unknown: {
    tier: 'unknown',
    label: 'غير معروفة',
    color: 'disabled',
    textColor: 'textMuted',
  },
};

/** Takes a bare string: `severity` is a C# string, so the server can send a step this file lacks. */
export function describeSeverity(severity: string): SeverityDisplay {
  return TIER_DISPLAY[SEVERITY_TIERS[severity as Severity] ?? 'unknown'];
}

/** True for the tier the حرج filter shows, so filter and badge agree by construction. */
export function isCriticalSeverity(severity: string): boolean {
  return SEVERITY_TIERS[severity as Severity] === 'critical';
}

/** The model's severity when there is an analysis, else priority: the row has nothing else. */
export function reportSeverity(report: Report, seesAi: boolean): Severity | undefined {
  if (report.analysis) {
    return seesAi ? report.analysis.severity : undefined;
  }

  return report.severity;
}
