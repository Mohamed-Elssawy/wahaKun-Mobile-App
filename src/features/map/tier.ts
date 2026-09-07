import { isResolvedStatus } from '@/features/reports/status';
import type { ReportStatus } from '@/features/reports/types';
import type { ColorToken } from '@/theme';

import type { MapIssueTier, MapPriorityName } from './types';

/** IssueStatus 6 is spelled `completed` server-side; every other name is capitalised. */
const WIRE_STATUS_FIXUPS: Record<string, ReportStatus> = {
  completed: 'Completed',
};

const STATUSES: readonly ReportStatus[] = [
  'Reported',
  'Diagnosed',
  'Verified',
  'Assigned',
  'Scheduled',
  'Repaired',
  'Completed',
];

/** Falls back rather than throwing: the server can grow IssueStatus before this file does. */
export function normalizeMapStatus(status: string): ReportStatus {
  const fixed = WIRE_STATUS_FIXUPS[status];
  if (fixed) {
    return fixed;
  }
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

/** Resolved wins over severity: a fixed problem reads green whatever it used to be. */
export function describeTier(
  priority: MapPriorityName | string,
  status: ReportStatus,
): MapIssueTier {
  if (isResolvedStatus(status)) {
    return 'resolved';
  }
  return TIER_BY_PRIORITY[priority] ?? 'low';
}

export type TierDisplay = {
  /** The pin fill and the legend swatch. */
  color: ColorToken;
  label: string;
};

// The four hexes in F-05's legend are error, warning, info and success exactly.
const TIER_DISPLAY: Record<MapIssueTier, TierDisplay> = {
  critical: { color: 'error', label: 'مشكلة خطورتها حرجة' },
  medium: { color: 'warning', label: 'مشكلة خطورتها متوسطة' },
  low: { color: 'info', label: 'مشكلة خطورتها منخفضة' },
  resolved: { color: 'success', label: 'مشكلة تم حلها' },
};

export function describeTierDisplay(tier: MapIssueTier): TierDisplay {
  return TIER_DISPLAY[tier];
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
