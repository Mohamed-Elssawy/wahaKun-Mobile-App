import { t } from '@/i18n';
import type { TranslationKey } from '@/i18n';
import type { ColorToken } from '@/theme';

import { publicStepperNode } from './selectors';
import { fromWireStatus } from './statuses';

import type { LifecycleFacts } from './nodes';
import type { ExpertAction } from './selectors';
import type { LifecycleStatus } from './statuses';
import type { ReportStatus } from '../types';

/** A token, not a lucide component: the model holds no React, so the chip resolves it. */
export type StatusIconToken = 'alert' | 'clock' | 'calendar' | 'check' | 'rotate';

export type StatusDisplay = {
  /** §3.2's feminine form, canonical, because the subject is مشكلة. */
  label: string;
  icon: StatusIconToken;
  /** §6.4's tint. F-01 draws every status in primary and lets the glyph carry the difference. */
  color: ColorToken;
};

/** Holds keys, not resolved strings: a module-scope t() would freeze the locale before §16.2 reads it from storage. */
type StatusEntry = Omit<StatusDisplay, 'label'> & { labelKey: TranslationKey };

// §6.2: every chip renders in primary green and the glyph alone carries the difference.
const STATUS_DISPLAY: Record<LifecycleStatus, StatusEntry> = {
  New: { labelKey: 'status.new', icon: 'alert', color: 'primary' },
  UnderReview: { labelKey: 'status.underReview', icon: 'clock', color: 'primary' },
  Scheduled: { labelKey: 'status.scheduled', icon: 'calendar', color: 'primary' },
  Resolved: { labelKey: 'status.resolved', icon: 'check', color: 'primary' },
  Reopened: { labelKey: 'status.reopened', icon: 'rotate', color: 'primary' },
  // §3.2: renders as تم الحل, so the farmer cannot tell an Admin closure from their own.
  AdminClosed: { labelKey: 'status.resolved', icon: 'check', color: 'primary' },
};

export function describeStatus(status: LifecycleStatus): StatusDisplay {
  const { labelKey, ...display } = STATUS_DISPLAY[status] ?? STATUS_DISPLAY.New;

  return { ...display, label: t(labelKey) };
}

/** For a row that holds nothing but a wire status, which is most list rows. */
export function describeWireStatus(status: ReportStatus): StatusDisplay {
  return describeStatus(fromWireStatus(status));
}

/** F-07's tab labels as keys: the TABS table is module scope too, so the screen calls t() where it renders. */
export const REPORT_FILTER_LABELS = {
  all: 'f07.tab.all',
  active: 'f07.tab.active',
  resolved: 'status.resolved',
  critical: 'severity.critical',
} as const satisfies Record<string, TranslationKey>;

/** §8.3's C-CTA labels. The mapping is in selectors; only the words are here. */
const EXPERT_ACTION_KEYS: Record<ExpertAction, TranslationKey> = {
  review: 'f07.tab.review',
  continue: 'f07.continue',
  view: 'f07.view',
};

export function expertActionLabel(action: ExpertAction): string {
  return t(EXPERT_ACTION_KEYS[action]);
}

export function rescheduleLabel(): string {
  return t('f07.rescheduled');
}

/** T13's copy, reused wherever the escalation withholds an AI-written title. */
export function untitledReport(): string {
  return t('f07.untitled');
}

/** §8.3's canonical short form, used wherever the AI block is suppressed. */
export function escalationLine(): string {
  return t('f07.escalationLine');
}

/** F-03b's heading, for the surfaces that replace a whole block rather than a line. */
export function escalationTitle(): string {
  return t('f03b.title');
}

/** F-03b's sub-heading, second-person: the report's own farmer, never shared with E-11. */
export function escalationSubtitle(): string {
  return t('f03b.subtitle');
}

/** The three draws F-04 has always had. §3.3's six nodes are the real timeline. */
export type StatusStage = 'reported' | 'inProgress' | 'resolved';

export function stageFor(facts: LifecycleFacts): StatusStage {
  const view = publicStepperNode(facts);

  if (view.isClosed) {
    return 'resolved';
  }

  // Node 3 is where it leaves the farmer's hands, which is what قيد الحل means to them.
  return view.current >= 3 ? 'inProgress' : 'reported';
}
