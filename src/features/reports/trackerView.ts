// Everything here is formatting; the node and status facts come from the S1 model.
import { Calendar, Camera, Check, Mic, Sparkles } from 'lucide-react-native';

import type { ContextChipTint, ReportSummaryCardMarker } from '@/components/ui';
import { contentIsolate, ltrIsolate, t } from '@/i18n';
import type { TranslationKey } from '@/i18n';

import { ExpertAvatarIcon } from './components/ExpertAvatarIcon';
import { STATUS_ICONS } from './components/statusIcon';
import { formatReportReference } from './format';
import {
  CONFIDENCE_THRESHOLD,
  currentNode,
  describeStatus,
  escalationLine,
  LIFECYCLE_NODES,
  publicStepperNode,
} from './lifecycle';
import {
  formatAbsoluteDateTime,
  formatCalendarDay,
  formatClockTime,
  formatRelativeTime,
} from './relativeTime';
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

const NODE_KEYS: Record<LifecycleNode, TranslationKey> = {
  1: 'tracker.node.reported',
  2: 'common.aiDiagnosis',
  3: 'tracker.node.expertReview',
  4: 'tracker.node.repairScheduled',
  5: 'tracker.node.repairCarriedOut',
  6: 'tracker.node.confirmAndFollow',
};

/** §8.2's Pending column. Nodes 1-3 have none: you cannot reach node 4+ without passing them. */
const PENDING_SUBTEXT: Partial<Record<LifecycleNode, TranslationKey>> = {
  4: 'tracker.appointmentSoon',
  5: 'tracker.awaitingScheduling',
  6: 'tracker.lastStep',
};

/** Undefined for nodes 1-3, which have no pending subtext at all. */
const pendingSubtext = (node: LifecycleNode) => {
  const key = PENDING_SUBTEXT[node];

  return key ? t(key) : undefined;
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
        label: t('tracker.voiceNoteLogged'),
      }
    : {
        tint: 'system',
        icon: Camera,
        label: t('tracker.photoLogged'),
      };
}

/** §8.2 node 2: the confidence pill at or above the threshold, the escalation line below it. */
function diagnosisChip(analysis: NonNullable<Report['analysis']>): TimelineChip {
  if (analysis.confidence < CONFIDENCE_THRESHOLD) {
    return { tint: 'system', label: escalationLine() };
  }

  const percent = Math.round(analysis.confidence * 100);
  const diagnosis = analysis.problemArabic || analysis.problemName;
  return {
    tint: 'system',
    icon: Sparkles,
    // C61: the diagnosis is the author's and the rest is ours. Unisolated, an Arabic diagnosis
    // gave the whole chip its direction in the English UI and turned our half around
    // ("...confidence %91"). Isolated, the sentence takes its direction from its own words.
    label: t('tracker.diagnosisConfidence', {
      diagnosis: contentIsolate(diagnosis),
      percent,
    }),
  };
}

/** W3: nothing says whether expertName holds a name or a phone number, so the shape is guarded. */
const PHONE_NUMBER_SHAPE = /^\+?\d[\d\s-]{6,}$/;

function expertChip(
  expert: NonNullable<ReportTrackerDetails['expert']>,
  reassigned?: boolean,
): TimelineChip {
  const name = PHONE_NUMBER_SHAPE.test(expert.name)
    ? t('common.assignedExpert')
    : expert.name;
  // An empty specialty joined with a newline left a trailing blank line, so the join is conditional.
  const specialtyLine = reassigned
    ? [expert.specialty, t('tracker.expertReassigned')].filter(Boolean).join(' — ')
    : expert.specialty;
  const label = specialtyLine ? `${name}\n${specialtyLine}` : name;
  return { tint: 'system', icon: ExpertAvatarIcon, label };
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
      label: diagnosis
        ? t('tracker.diagnosisConfirmedWith', { diagnosis })
        : t('tracker.diagnosisConfirmed'),
    });
  }
  return chips;
}

function appointmentChip(
  appointment: NonNullable<ReportTrackerDetails['appointment']>,
): TimelineChip {
  const prefix = appointment.rescheduled
    ? t('tracker.rescheduled')
    : t('tracker.appointment');
  const reason =
    appointment.rescheduled && appointment.reason
      ? t('tracker.changeReason', { reason: contentIsolate(appointment.reason) })
      : '';

  return {
    tint: 'system',
    icon: Calendar,
    label: t('tracker.appointmentWindow', {
      prefix,
      date: formatCalendarDay(appointment.date),
      windowStart: formatClockTime(appointment.windowStart),
      windowEnd: formatClockTime(appointment.windowEnd),
      reason,
    }),
  };
}

/** §8.2's node-6 closure table. Both branches stay coded; only 'farmer' is reachable from mobile. */
function closureChip(details: ReportTrackerDetails, report: Report): TimelineChip {
  if (details.closedBy === 'admin') {
    return { tint: 'system', icon: Check, label: t('tracker.adminClosed') };
  }
  // The reference arrives whole, `#` included and isolated, the way every other surface shows
  // it: the copy used to carry its own `#`, which doubled it, and report.id is a server GUID.
  return {
    tint: 'system',
    icon: Check,
    label: t('tracker.farmerConfirmed', {
      id: ltrIsolate(formatReportReference(report.id)),
    }),
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
    const label = t(NODE_KEYS[node]);

    if (markerState === 'pending') {
      return {
        node,
        label,
        markerState,
        subtext: pendingSubtext(node),
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
          // W13: no analysis is not LOW confidence. The live farmer read carries none at all, and
          // calling every one of those an escalation told farmers whose photo scored 90-100% that
          // their case "needs a closer look". With nothing to show, node 2 shows no chip.
          chips: report.analysis ? [diagnosisChip(report.analysis)] : [],
          showApproval: false,
        };

      case 3:
        if (markerState === 'current') {
          return {
            node,
            label,
            markerState,
            subtext: details.assignedAt
              ? t('tracker.inProgressSince', {
                  time: formatRelativeTime(details.assignedAt),
                })
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
              ? t('tracker.inProgressSince', {
                  time: formatRelativeTime(details.reviewedAt),
                })
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
            subtext: t('tracker.repairOnSchedule'),
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
          chips: [
            { tint: 'system', icon: Check, label: t('tracker.repairedSuccessfully') },
          ],
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
            // The frame draws the pending line above the approval card while node 6 is current.
            subtext: pendingSubtext(6),
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
