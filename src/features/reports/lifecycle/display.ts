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

const STATUS_DISPLAY: Record<LifecycleStatus, StatusDisplay> = {
  New: { label: 'جديدة', icon: 'alert', color: 'error' },
  UnderReview: { label: 'قيد المراجعة', icon: 'clock', color: 'info' },
  Scheduled: { label: 'مجدولة', icon: 'calendar', color: 'warning' },
  Resolved: { label: 'تم الحل', icon: 'check', color: 'success' },
  Reopened: { label: 'معاد فتحها', icon: 'rotate', color: 'warning' },
  // §3.2: renders as تم الحل, so the farmer cannot tell an Admin closure from their own.
  AdminClosed: { label: 'تم الحل', icon: 'check', color: 'success' },
};

export function describeStatus(status: LifecycleStatus): StatusDisplay {
  return STATUS_DISPLAY[status] ?? STATUS_DISPLAY.New;
}

/** For a row that holds nothing but a wire status, which is most list rows. */
export function describeWireStatus(status: ReportStatus): StatusDisplay {
  return describeStatus(fromWireStatus(status));
}

/** §8.3's C-CTA labels. The mapping is in selectors; only the words are here. */
export const EXPERT_ACTION_LABELS: Record<ExpertAction, string> = {
  review: 'مراجعة',
  continue: 'متابعة',
  view: 'عرض',
};

export const RESCHEDULE_LABEL = 'إعادة الجدولة';

/** T13's copy, reused wherever the escalation withholds an AI-written title. */
export const UNTITLED_REPORT = 'بلاغ بدون وصف';

/** §8.3's canonical short form, used wherever the AI block is suppressed. */
export const ESCALATION_LINE = 'الحالة تحتاج نظرة دقيقة — سيراجع خبير البلاغ شخصياً';

/** F-03b's heading, for the surfaces that replace a whole block rather than a line. */
export const ESCALATION_TITLE = 'خبير سيراجع بلاغك شخصيًا';

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
