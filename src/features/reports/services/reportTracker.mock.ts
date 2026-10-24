// In-memory ReportTrackerDetails for when no IssueController read endpoint exists at all.
import { failOnErrorScenario, mockDelay } from '@/api/mockScenario';

import type { ReportTrackerDetails } from '../types';

const LATENCY = { read: 500, write: 700 } as const;

/** Device-clock relative, so the relative-time copy stays true whenever this is demoed. */
function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function daysAgo(days: number): string {
  return minutesAgo(days * 24 * 60);
}

/** One fixture per F-06 named state, keyed by the id reportService.mock.ts seeds for it. */
const FIXTURES: Record<string, ReportTrackerDetails> = {
  // escalated: node 3 is current, and node 2's chip is the escalation line, not a missing expert.
  '1050': {
    reportId: '1050',
    status: 'Assigned',
    hasExpertReview: false,
    expert: { name: 'سارة محمود', specialty: 'خبيرة ري' },
    assignedAt: minutesAgo(15),
  },
  // reviewing: node 3 current, expert assigned, review not yet submitted.
  '1043': {
    reportId: '1043',
    status: 'Assigned',
    hasExpertReview: false,
    expert: { name: 'سارة محمود', specialty: 'خبيرة ري' },
    assignedAt: minutesAgo(30),
  },
  // scheduling: node 4 current, and both datetimes read from reviewedAt, since it is one event.
  '1040': {
    reportId: '1040',
    status: 'Assigned',
    hasExpertReview: true,
    expert: { name: 'سارة محمود', specialty: 'خبيرة ري' },
    assignedAt: '2026-06-06T09:00:00Z',
    reviewedAt: minutesAgo(52),
  },
  // resolving - node 5 current. Appointment confirmed (T5), repair not yet done (T6 pending).
  '1035': {
    reportId: '1035',
    status: 'Scheduled',
    hasExpertReview: true,
    expert: { name: 'عمر الشريف', specialty: 'خبير صيانة قنوات' },
    assignedAt: '2026-06-12T08:00:00Z',
    reviewedAt: '2026-06-12T17:32:00Z',
    appointment: {
      confirmedAt: '2026-06-12T20:07:00Z',
      date: '2026-06-14',
      windowStart: '09:00 ص',
      windowEnd: '12:00 م',
    },
  },
  // pending-approval - node 6 current, open. Repair published (T6), farmer has not tapped yet.
  '1037': {
    reportId: '1037',
    status: 'Repaired',
    hasExpertReview: true,
    expert: { name: 'سارة محمود', specialty: 'خبيرة ري' },
    assignedAt: '2026-06-03T10:00:00Z',
    reviewedAt: '2026-06-10T17:32:00Z',
    appointment: {
      confirmedAt: '2026-06-10T20:07:00Z',
      date: '2026-06-14',
      windowStart: '09:00 ص',
      windowEnd: '12:00 م',
    },
    repair: {
      confirmedAt: '2026-06-14T09:41:00Z',
      notes: 'تم تبطين الجزء التالف من القناة بمادة عازلة و إيقاف التسرب بالكامل.',
      photoUrl: 'https://picsum.photos/seed/wahakun-repair/900/675',
    },
  },
  // resolved - node 6, closed by the farmer's own tap (T7).
  '1020': {
    reportId: '1020',
    status: 'completed',
    hasExpertReview: true,
    expert: { name: 'عمر الشريف', specialty: 'خبير صيانة قنوات' },
    assignedAt: '2026-06-08T08:00:00Z',
    reviewedAt: '2026-06-08T17:00:00Z',
    appointment: {
      confirmedAt: '2026-06-08T20:00:00Z',
      date: '2026-06-10',
      windowStart: '10:00 ص',
      windowEnd: '01:00 م',
    },
    repair: {
      confirmedAt: '2026-06-10T11:30:00Z',
      notes: 'تم استبدال الوصلة التالفة وإحكام الأطواق.',
      photoUrl: 'https://picsum.photos/seed/wahakun-resolved/900/675',
    },
    closedBy: 'farmer',
    closedAt: '2026-06-11T08:00:00Z',
  },
  // reopened: nodes 4-5 cleared. Development-only, since IssueStatus has no value for it (G2).
  '1045': {
    reportId: '1045',
    status: 'Assigned',
    hasExpertReview: false,
    expert: { name: 'سارة محمود', specialty: 'خبيرة ري' },
    assignedAt: minutesAgo(30),
    reopened: true,
  },
  // expert-changed: T15 is supported server-side but has no known wire signal.
  '1046': {
    reportId: '1046',
    status: 'Assigned',
    hasExpertReview: false,
    expert: { name: 'محمد عمرو', specialty: 'خبير ري' },
    assignedAt: minutesAgo(30),
    expertReassigned: true,
  },
  // Shared with the expert mock: its T5/T6 writes land on this entry, so F-06 shows them live.
  '2010': {
    reportId: '2010',
    status: 'Assigned',
    hasExpertReview: true,
    expert: { name: 'سارة محمود', specialty: 'خبيرة ري' },
    assignedAt: daysAgo(6),
    reviewedAt: daysAgo(5),
  },
};

// Mutable so confirm/reject can move a case while the app runs.
const trackers = new Map(Object.entries(FIXTURES));

export async function getReportTracker(reportId: string): Promise<ReportTrackerDetails> {
  await mockDelay(LATENCY.read);
  failOnErrorScenario('تعذر تحميل مسار البلاغ');

  const found = trackers.get(reportId);
  if (!found) {
    throw new Error(`Mock: no tracker for report ${reportId}`);
  }
  return found;
}

/** T7. A dead end in the mock: its visual aftermath is out of scope. */
export async function confirmResolution(reportId: string): Promise<void> {
  await mockDelay(LATENCY.write);
  failOnErrorScenario('تعذر تأكيد الحل');

  const current = trackers.get(reportId);
  if (!current) {
    throw new Error(`Mock: no tracker for report ${reportId}`);
  }

  trackers.set(reportId, {
    ...current,
    status: 'completed',
    closedBy: 'farmer',
    closedAt: new Date().toISOString(),
  });
}

/** T8. Clears nodes 4-5, so the repair photo leaves the expert's view too. */
export async function rejectResolution(reportId: string): Promise<void> {
  await mockDelay(LATENCY.write);
  failOnErrorScenario('تعذر إرسال الرفض');

  const current = trackers.get(reportId);
  if (!current) {
    throw new Error(`Mock: no tracker for report ${reportId}`);
  }

  trackers.set(reportId, {
    reportId: current.reportId,
    status: 'Assigned',
    hasExpertReview: false,
    expert: current.expert,
    assignedAt: new Date().toISOString(),
  });
}

/** T5, from the expert mock. A no-op for any id the tracker does not carry. */
export function applyExpertAppointment(
  reportId: string,
  appointment: {
    date: string;
    windowStart: string;
    windowEnd: string;
    rescheduled?: boolean;
    reason?: string;
  },
): void {
  const current = trackers.get(reportId);
  if (!current) {
    return;
  }

  trackers.set(reportId, {
    ...current,
    status: 'Assigned',
    appointment: { confirmedAt: new Date().toISOString(), ...appointment },
  });
}

/** T6, called from the expert mock. Same no-op rule as `applyExpertAppointment`. */
export function applyExpertRepair(
  reportId: string,
  repair: { notes: string; photoUrl: string },
): void {
  const current = trackers.get(reportId);
  if (!current) {
    return;
  }

  trackers.set(reportId, {
    ...current,
    status: 'Repaired',
    repair: { confirmedAt: new Date().toISOString(), ...repair },
  });
}

/** Restores the seeded data. Useful from a dev screen or a test. */
export function resetMockTracker() {
  trackers.clear();
  for (const [id, details] of Object.entries(FIXTURES)) {
    trackers.set(id, details);
  }
}
