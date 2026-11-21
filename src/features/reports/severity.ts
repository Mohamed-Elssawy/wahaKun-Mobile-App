// THE SAME ARABIC APPEARS IN THIS FILE IN THREE ROLES. Read this before touching any of it.
//
//   UNKNOWN_SEVERITY, SEVERITY_FOR_PRIORITY   WIRE. What the vision service sends and what
//   (lines below)                             IssueService stores. Pinned in scripts/i18n-wire.js.
//                                             Translating one breaks severity parsing with no
//                                             error anywhere: describeSeverity falls through to
//                                             'unknown' and the report reads as untracked.
//
//   SEVERITY_TIERS' keys                      WIRE, and INVISIBLE. Five of the ten are bare
//                                             identifiers, because Arabic letters are valid
//                                             ID_Start - so neither the extractor nor the ESLint
//                                             selector can see them. The dividing line is purely
//                                             orthographic: a single-word severity is a legal
//                                             identifier, a multi-word one holds a space, must be
//                                             quoted, and becomes a Literal they both see. The
//                                             deck proves it by holding a row for exactly the
//                                             quoted five. Quoting a bare one fails a test in
//                                             scripts/__tests__/i18n-pipeline.test.js, which is
//                                             the only thing standing where a lint rule cannot.
//
//   TIER_DISPLAY's labelKey                   COPY. The four labels a farmer reads, keyed in E5.
//                                             These are the ONLY strings in this file that
//                                             belong in a catalogue.
//
// E5 note: 'حرجة' now appears once as a literal, at line 13, and that one is wire. The label with
// the identical characters lives in the catalogue under severity.critical. An Arabic wire enum is
// the root cause of all of this and is filed with the backend as item 11.

import { t } from '@/i18n';
import type { TranslationKey } from '@/i18n';
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

/** Keys, not labels: describeSeverity resolves them, because §16.2 resolves the locale after
 * this module is imported. The four display labels are the ONLY Arabic in this file that is
 * copy - see the header. */
type TierEntry = Omit<SeverityDisplay, 'label'> & { labelKey: TranslationKey };

const TIER_DISPLAY: Record<SeverityTier, TierEntry> = {
  critical: {
    tier: 'critical',
    labelKey: 'severity.critical',
    color: 'error',
    textColor: 'errorText',
  },
  medium: {
    tier: 'medium',
    labelKey: 'severity.medium',
    color: 'warning',
    textColor: 'warningText',
  },
  low: { tier: 'low', labelKey: 'severity.low', color: 'info', textColor: 'infoText' },
  unknown: {
    tier: 'unknown',
    labelKey: 'severity.unknown',
    color: 'disabled',
    textColor: 'textMuted',
  },
};

/** Takes a bare string: `severity` is a C# string, so the server can send a step this file lacks. */
export function describeSeverity(severity: string): SeverityDisplay {
  const { labelKey, ...display } =
    TIER_DISPLAY[SEVERITY_TIERS[severity as Severity] ?? 'unknown'];

  return { ...display, label: t(labelKey) };
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
