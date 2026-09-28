import type { ColorToken } from '@/theme';

import type { ReportStatus } from './types';

/** IssueStatus's seven steps collapsed to the three F-04 draws. */
export type StatusStage = 'reported' | 'inProgress' | 'resolved';

const STAGES: Record<ReportStatus, StatusStage> = {
  Reported: 'reported',
  Diagnosed: 'inProgress',
  Verified: 'inProgress',
  Assigned: 'inProgress',
  Scheduled: 'inProgress',
  Repaired: 'resolved',
  Completed: 'resolved',
};

export function stageFor(status: ReportStatus): StatusStage {
  return STAGES[status] ?? 'reported';
}

/** The two statuses that mean the farmer's problem is over. Backs the تم الحل filter. */
export function isResolvedStatus(status: ReportStatus): boolean {
  return stageFor(status) === 'resolved';
}

export type StatusDisplay = {
  /** The status line on F-01. Feminine throughout, because the subject is مشكلة. */
  label: string;
  /** F-01 V2 draws every status in primary and lets the glyph carry the difference, so
   *  nothing reads this yet. It stays because the status genuinely has a hue, and F-07's
   *  rework is the screen likely to want it. */
  color: ColorToken;
};

// Four labels for seven statuses, because the farmer acts on the stage, not the step.
const STATUS_DISPLAY: Record<ReportStatus, StatusDisplay> = {
  Reported: { label: 'جديدة', color: 'error' },
  Diagnosed: { label: 'قيد المعالجة', color: 'info' },
  Verified: { label: 'قيد المعالجة', color: 'info' },
  Assigned: { label: 'قيد المعالجة', color: 'info' },
  Scheduled: { label: 'مجدولة', color: 'warning' },
  Repaired: { label: 'تم الحل', color: 'success' },
  Completed: { label: 'تم الحل', color: 'success' },
};

/** Falls back rather than throwing: the server can grow IssueStatus before this file does. */
export function describeStatusDisplay(status: ReportStatus): StatusDisplay {
  return STATUS_DISPLAY[status] ?? STATUS_DISPLAY.Reported;
}
