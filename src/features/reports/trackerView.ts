// Everything here is formatting; the node and status facts come from the S1 model.
import { Calendar, Camera, Check, Mic, Sparkles, User } from 'lucide-react-native';

import type { ContextChipTint, ReportSummaryCardMarker } from '@/components/ui';

import { STATUS_ICONS } from './components/statusIcon';
import {
  CONFIDENCE_THRESHOLD,
  currentNode,
  describeStatus,
  ESCALATION_LINE,
  LIFECYCLE_NODES,
  publicStepperNode,
} from './lifecycle';
import { formatAbsoluteDateTime, formatRelativeTime } from './relativeTime';
import { trackerFacts } from './trackerFacts';

import type { LifecycleNode } from './lifecycle';
import type { Report, ReportTrackerDetails } from './types';
import type { LucideIcon } from 'lucide-react-native';

export type TimelineMarkerState = 'done' | 'current' | 'pending';

export type TimelineChip = {
  tint: ContextChipTint;
  icon?: LucideIcon;
  label: string;
};

export type TimelineNodeView = {
  node: LifecycleNode;
  label: string;
  markerState: TimelineMarkerState;
  /** Shown above the chips, only once there is something to date - never on a pending node. */
  dateTime?: string;
  /** Node 4-6's pending/current copy; §8.2's table gives nodes 1-3 none, so those stay empty. */
  subtext?: string;
  chips: TimelineChip[];
  /** Node 6 only, and only while it is current and the case is still open. */
  showApproval: boolean;
  /** Node 5's repair photo, which carries a thumbnail ContextChip has no slot for. */
  repairPhoto?: { url: string; notes: string };
};

const NODE_LABELS: Record<LifecycleNode, string> = {
  1: 'تم الابلاغ',
  2: 'تشخيص الذكاء الاصطناعي',
  3: 'المراجعة من الخبير',
  4: 'جدولة الإصلاح',
  5: 'تنفيذ الإصلاح',
  6: 'تأكيد الحل ومتابعة',
};

/** §8.2's Pending column. Nodes 1-3 have none: you cannot reach node 4+ without passing them. */
const PENDING_SUBTEXT: Partial<Record<LifecycleNode, string>> = {
  4: 'سيُحدَّد الموعد قريباً',
  5: 'في انتظار الجدولة',
  6: 'آخر خطوة — سيُطلب تأكيدك',
};

function markerStateFor(
  node: LifecycleNode,
  current: LifecycleNode,
  isClosed: boolean,
): TimelineMarkerState {
  if (isClosed || node < current) {
    return 'done';
  }
  return node === current ? 'current' : 'pending';
}

/** INFERRED: only the voice copy is given, so the photo line mirrors its structure. */
function evidenceChip(report: Report): TimelineChip {
  const hasVoice = report.attachments.some(attachment => attachment.type === 'Voice');

  return hasVoice
    ? {
        tint: 'system',
        icon: Mic,
        label: 'تم تسجيل ملاحظة صوتية. تم نشرها مع تحديد الموقع تلقائياً',
      }
    : {
        tint: 'system',
        icon: Camera,
        label: 'تم إرفاق صورة للمشكلة. تم نشرها مع تحديد الموقع تلقائياً',
      };
}

/** §8.2 node 2: the confidence pill at or above the threshold, the escalation line below it. */
function diagnosisChip(report: Report): TimelineChip {
  const analysis = report.analysis;
  if (!analysis || analysis.confidence < CONFIDENCE_THRESHOLD) {
    return { tint: 'system', label: ESCALATION_LINE };
  }

  const percent = Math.round(analysis.confidence * 100);
  const diagnosis = analysis.problemArabic || analysis.problemName;
  return { tint: 'system', icon: Sparkles, label: `${diagnosis} — ثقة ${percent}%` };
}

/** T15's note, mock-only - see `ReportTrackerDetails.expertReassigned`'s two open unknowns. */
const EXPERT_REASSIGNED_NOTE = 'تم إعادة تعيين الخبير';

/** §8.3's expert section label, reused when expert.name cannot be shown as a name. */
const EXPERT_ROLE_LABEL = 'الخبير المسؤول عن البلاغ';

/** W3: nothing says whether expertName holds a name or a phone number, so the shape is guarded. */
const PHONE_NUMBER_SHAPE = /^\+?\d[\d\s-]{6,}$/;

function expertChip(
  expert: NonNullable<ReportTrackerDetails['expert']>,
  reassigned?: boolean,
): TimelineChip {
  const name = PHONE_NUMBER_SHAPE.test(expert.name) ? EXPERT_ROLE_LABEL : expert.name;
  // An empty specialty joined with a newline left a trailing blank line, so the join is conditional.
  const specialtyLine = reassigned
    ? [expert.specialty, EXPERT_REASSIGNED_NOTE].filter(Boolean).join(' — ')
    : expert.specialty;
  const label = specialtyLine ? `${name}\n${specialtyLine}` : name;
  return { tint: 'system', icon: User, label };
}

/** Node 3's done payload: the expert chip plus the confirmation chip T4 published. */
function reviewChips(details: ReportTrackerDetails, report: Report): TimelineChip[] {
  const chips: TimelineChip[] = [];
  if (details.expert) {
    chips.push(expertChip(details.expert, details.expertReassigned));
  }
  if (details.reviewedAt) {
    const diagnosis = report.analysis?.problemArabic || report.analysis?.problemName;
    chips.push({
      tint: 'system',
      icon: Check,
      label: diagnosis ? `تم تأكيد التشخيص — ${diagnosis}` : 'تم تأكيد التشخيص',
    });
  }
  return chips;
}

function appointmentChip(
  appointment: NonNullable<ReportTrackerDetails['appointment']>,
): TimelineChip {
  const prefix = appointment.rescheduled ? 'تمت إعادة الجدولة' : 'موعد الإصلاح';
  const reason =
    appointment.rescheduled && appointment.reason
      ? `\nسبب التغيير: ${appointment.reason}`
      : '';
  return {
    tint: 'system',
    icon: Calendar,
    label: `${prefix}\n${appointment.date} — ${appointment.windowStart} إلى ${appointment.windowEnd}${reason}`,
  };
}

/** §8.2's node-6 closure table. Both branches stay coded; only 'farmer' is reachable from mobile. */
function closureChip(details: ReportTrackerDetails, report: Report): TimelineChip {
  if (details.closedBy === 'admin') {
    return { tint: 'system', icon: Check, label: 'تم إغلاق البلاغ بعد مراجعة الإدارة' };
  }
  return {
    tint: 'system',
    icon: Check,
    label: `أكّد المزارع الحل\nتم إغلاق البلاغ #${report.id} بنجاح`,
  };
}

/** Arranges and formats only: every status and node answer comes from trackerFacts. */
export function buildTrackerView(
  report: Report,
  details: ReportTrackerDetails,
): TimelineNodeView[] {
  const facts = trackerFacts(details);
  const current = currentNode(facts);
  const stepper = publicStepperNode(facts);

  return LIFECYCLE_NODES.map((node): TimelineNodeView => {
    const markerState = markerStateFor(node, current, stepper.isClosed);
    const label = NODE_LABELS[node];

    if (markerState === 'pending') {
      return {
        node,
        label,
        markerState,
        subtext: PENDING_SUBTEXT[node],
        chips: [],
        showApproval: false,
      };
    }

    switch (node) {
      case 1:
        return {
          node,
          label,
          markerState: 'done',
          dateTime: formatAbsoluteDateTime(report.createdAt),
          chips: [evidenceChip(report)],
          showApproval: false,
        };

      case 2:
        return {
          node,
          label,
          markerState: 'done',
          dateTime: report.analysis
            ? formatAbsoluteDateTime(report.analysis.createdAt)
            : undefined,
          chips: [diagnosisChip(report)],
          showApproval: false,
        };

      case 3:
        if (markerState === 'current') {
          return {
            node,
            label,
            markerState,
            subtext: details.assignedAt
              ? `جارٍ الآن — ${formatRelativeTime(details.assignedAt)}`
              : undefined,
            chips: details.expert
              ? [expertChip(details.expert, details.expertReassigned)]
              : [],
            showApproval: false,
          };
        }
        return {
          node,
          label,
          markerState: 'done',
          dateTime: details.reviewedAt
            ? formatAbsoluteDateTime(details.reviewedAt)
            : undefined,
          chips: reviewChips(details, report),
          showApproval: false,
        };

      case 4:
        if (markerState === 'current') {
          return {
            node,
            label,
            markerState,
            subtext: details.reviewedAt
              ? `جارٍ الآن — ${formatRelativeTime(details.reviewedAt)}`
              : undefined,
            chips: [],
            showApproval: false,
          };
        }
        return {
          node,
          label,
          markerState: 'done',
          dateTime: details.appointment
            ? formatAbsoluteDateTime(details.appointment.confirmedAt)
            : undefined,
          chips: details.appointment ? [appointmentChip(details.appointment)] : [],
          showApproval: false,
        };

      case 5:
        if (markerState === 'current') {
          // §8.2: static copy, not a relative time - the one current-state exception.
          return {
            node,
            label,
            markerState,
            subtext: 'سيتم تنفيذ الإصلاح في الموعد المحدد',
            chips: [],
            showApproval: false,
          };
        }
        // D5/D6: the node is drawn done either way; the datetime and thumbnail need the wire to supply one.
        return {
          node,
          label,
          markerState: 'done',
          dateTime: details.repair?.confirmedAt
            ? formatAbsoluteDateTime(details.repair.confirmedAt)
            : undefined,
          chips: [{ tint: 'system', icon: Check, label: 'تم الإصلاح بنجاح' }],
          showApproval: false,
          repairPhoto: details.repair?.photoUrl
            ? { url: details.repair.photoUrl, notes: details.repair.notes }
            : undefined,
        };

      case 6:
      default:
        if (markerState === 'current') {
          return {
            node,
            label,
            markerState,
            subtext: PENDING_SUBTEXT[6],
            chips: [],
            showApproval: !stepper.isClosed,
          };
        }
        return {
          node,
          label,
          markerState: 'done',
          dateTime: details.closedAt
            ? formatAbsoluteDateTime(details.closedAt)
            : undefined,
          chips: [closureChip(details, report)],
          showApproval: false,
        };
    }
  });
}

/** F-07's contextual slot: what the farmer most needs now, not F-06's strict per-node set. */
export type ActiveCardSlot =
  { kind: 'chip'; chip: TimelineChip } | { kind: 'approval' } | null;

export function buildActiveCardSlot(details: ReportTrackerDetails): ActiveCardSlot {
  const facts = trackerFacts(details);
  const stepper = publicStepperNode(facts);
  if (stepper.isClosed) {
    return null;
  }

  const current = currentNode(facts);

  if (current === 3) {
    return details.expert
      ? { kind: 'chip', chip: expertChip(details.expert, details.expertReassigned) }
      : null;
  }
  if (current === 4 || current === 5) {
    return details.appointment
      ? { kind: 'chip', chip: appointmentChip(details.appointment) }
      : null;
  }
  if (current === 6) {
    return { kind: 'approval' };
  }
  return null;
}

/** §8.2's "الخطوة N من 6" - `currentNode`, read straight off the model, never recomputed. */
export function activeCardStep(details: ReportTrackerDetails): LifecycleNode {
  return currentNode(trackerFacts(details));
}

/** details.reopened already is the lifecycle status, so the flag is read straight. */
export function reopenedMarker(
  details: ReportTrackerDetails,
): ReportSummaryCardMarker | null {
  if (!details.reopened) {
    return null;
  }
  const status = describeStatus('Reopened');
  return { icon: STATUS_ICONS[status.icon], label: status.label };
}
