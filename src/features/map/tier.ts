import { isClosedWireStatus } from '@/features/reports/lifecycle';
import type { ReportStatus } from '@/features/reports/types';
import { t } from '@/i18n';
import type { TranslationKey } from '@/i18n';
import type { ColorToken } from '@/theme';

import type { MapIssueTier, MapPriorityName } from './types';

const STATUSES: readonly ReportStatus[] = [
  'Reported',
  'Diagnosed',
  'Verified',
  'Assigned',
  'Reviewed',
  'Scheduled',
  'Repaired',
  'completed',
];

/** Falls back rather than throwing: the server can grow IssueStatus before this file does. */
export function normalizeMapStatus(status: string): ReportStatus {
  return STATUSES.find(known => known === status) ?? 'Reported';
}

/** Priority by name. `"4"` is here because Map stops at Critical = 3 and ReportService writes 4. */
// TODO: drop the numeric keys once MapService's IssuePriority matches ReportService's.
const TIER_BY_PRIORITY: Record<string, MapIssueTier> = {
  Critical: 'critical',
  High: 'critical',
  Medium: 'medium',
  Low: 'low',
  Unknown: 'low',
  // What the mismatch actually puts on the wire, read with ReportService's numbering.
  '0': 'low',
  '1': 'low',
  '2': 'medium',
  '3': 'critical',
  '4': 'critical',
};

/** Closed wins over severity: a case the farmer settled reads green whatever it used to be. */
export function describeTier(
  priority: MapPriorityName | string,
  status: ReportStatus,
): MapIssueTier {
  if (isClosedWireStatus(status)) {
    return 'resolved';
  }
  return TIER_BY_PRIORITY[priority] ?? 'low';
}

export type TierDisplay = {
  /** The pin fill and the legend swatch. */
  color: ColorToken;
  /** F-05's legend, which has room for the whole sentence. */
  label: string;
  /** F-01's card badge and its filter chips, where only the severity itself fits. */
  shortLabel: string;
};

// The four hexes in F-05's legend are error, warning, info and success exactly.
type TierEntry = {
  color: TierDisplay['color'];
  labelKey: TranslationKey;
  shortLabelKey: TranslationKey;
};

const TIER_DISPLAY: Record<MapIssueTier, TierEntry> = {
  critical: {
    color: 'error',
    labelKey: 'f01.pinA11y.critical',
    shortLabelKey: 'severity.critical',
  },
  medium: {
    color: 'warning',
    labelKey: 'f01.pinA11y.medium',
    shortLabelKey: 'severity.medium',
  },
  low: { color: 'info', labelKey: 'f01.pinA11y.low', shortLabelKey: 'severity.low' },
  resolved: {
    color: 'success',
    labelKey: 'f01.pinA11y.resolved',
    shortLabelKey: 'status.resolved',
  },
};

export function describeTierDisplay(tier: MapIssueTier): TierDisplay {
  const { color, labelKey, shortLabelKey } = TIER_DISPLAY[tier];

  return { color, label: t(labelKey), shortLabel: t(shortLabelKey) };
}

/** Legend order, worst first, which is how F-05 lists them. */
export const TIER_ORDER: readonly MapIssueTier[] = [
  'critical',
  'medium',
  'low',
  'resolved',
];

/** A cluster takes the worst tier it holds, so a critical issue is never hidden by a count. */
export function worstTier(tiers: readonly MapIssueTier[]): MapIssueTier {
  return TIER_ORDER.find(tier => tiers.includes(tier)) ?? 'low';
}
