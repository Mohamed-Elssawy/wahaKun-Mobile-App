import { CONFIDENCE_THRESHOLD, ESCALATION_LINE } from '../lifecycle';
import {
  activeCardStep,
  buildActiveCardSlot,
  buildTrackerView,
  reopenedMarker,
} from '../trackerView';

import type { Report, ReportTrackerDetails } from '../types';

const BASE_REPORT: Report = {
  id: '1043',
  status: 'Assigned',
  createdAt: '2026-06-10T09:41:00Z',
  reporterId: 'farmer-1',
  attachments: [
    {
      id: 'a-1',
      type: 'Photo',
      url: 'https://example.com/p.jpg',
      createdAt: '2026-06-10T09:41:00Z',
    },
  ],
  analysis: {
    filePath: 'reportimage/p.jpg',
    problemName: 'Leak',
    problemArabic: 'تسريب في القناة',
    confidence: 0.91,
    severity: 'حرجة',
    recommendation: 'إصلاح فوري',
    repairSteps: [],
    modelVersion: '',
    createdAt: '2026-06-10T09:41:00Z',
  },
};

const UNDER_REVIEW: ReportTrackerDetails = {
  reportId: '1043',
  status: 'Assigned',
  hasExpertReview: false,
  expert: { name: 'سارة محمود', specialty: 'خبيرة ري' },
  assignedAt: '2026-06-10T17:02:00Z',
};

describe('buildTrackerView', () => {
  it('shows the confidence pill at or above the threshold', () => {
    const view = buildTrackerView(BASE_REPORT, UNDER_REVIEW);
    const node2 = view.find(n => n.node === 2);

    expect(node2?.chips[0].label).toContain('ثقة 91%');
  });

  it('shows the escalation line below the threshold, even though an expert is already assigned', () => {
    const lowConfidenceReport: Report = {
      ...BASE_REPORT,
      analysis: { ...BASE_REPORT.analysis!, confidence: CONFIDENCE_THRESHOLD - 0.01 },
    };
    const view = buildTrackerView(lowConfidenceReport, UNDER_REVIEW);
    const node2 = view.find(n => n.node === 2);
    const node3 = view.find(n => n.node === 3);

    expect(node2?.chips[0].label).toBe(ESCALATION_LINE);
    // §8.2: T3 auto-routes regardless of confidence, so node 3 is still current with its chip.
    expect(node3?.markerState).toBe('current');
    expect(node3?.chips).toHaveLength(1);
  });

  it('gives nodes 1-3 no pending subtext, since they cannot be reached in a pending state', () => {
    const view = buildTrackerView(BASE_REPORT, UNDER_REVIEW);
    const [node1, node2] = view;

    expect(node1.markerState).toBe('done');
    expect(node2.markerState).toBe('done');
    expect(view.find(n => n.node === 4)?.subtext).toBeTruthy();
  });

  it('shows the approval control only at node 6, current, open', () => {
    const openNode6: ReportTrackerDetails = {
      reportId: '1037',
      status: 'Repaired',
      hasExpertReview: true,
      repair: {
        confirmedAt: '2026-06-14T09:41:00Z',
        notes: 'تم الإصلاح',
        photoUrl: 'https://example.com/r.jpg',
      },
    };
    const view = buildTrackerView(BASE_REPORT, openNode6);
    const node6 = view.find(n => n.node === 6);

    expect(node6?.markerState).toBe('current');
    expect(node6?.showApproval).toBe(true);
  });

  it('never shows the approval control once the case is closed', () => {
    const closed: ReportTrackerDetails = {
      reportId: '1020',
      status: 'completed',
      closedBy: 'farmer',
      closedAt: '2026-06-11T08:00:00Z',
    };
    const view = buildTrackerView(BASE_REPORT, closed);
    const node6 = view.find(n => n.node === 6);

    expect(node6?.markerState).toBe('done');
    expect(node6?.showApproval).toBe(false);
  });

  it('reverts to node 3 and clears nodes 4-5 when reopened, even with a scheduled-looking status', () => {
    const reopened: ReportTrackerDetails = {
      reportId: '1045',
      status: 'Assigned',
      hasExpertReview: false,
      expert: { name: 'سارة محمود', specialty: 'خبيرة ري' },
      assignedAt: '2026-06-20T10:00:00Z',
      reopened: true,
    };
    const view = buildTrackerView(BASE_REPORT, reopened);
    const [node3, node4, node5] = [
      view.find(n => n.node === 3),
      view.find(n => n.node === 4),
      view.find(n => n.node === 5),
    ];

    expect(node3?.markerState).toBe('current');
    expect(node4?.markerState).toBe('pending');
    expect(node4?.chips).toHaveLength(0);
    expect(node5?.markerState).toBe('pending');
    expect(node5?.chips).toHaveLength(0);
  });

  it("appends the reassignment note to the expert chip's specialty line, T15", () => {
    const reassigned: ReportTrackerDetails = {
      ...UNDER_REVIEW,
      expert: { name: 'محمد عمرو', specialty: 'خبير ري' },
      expertReassigned: true,
    };
    const view = buildTrackerView(BASE_REPORT, reassigned);
    const node3 = view.find(n => n.node === 3);

    expect(node3?.chips[0].label).toBe('محمد عمرو\nخبير ري — تم إعادة تعيين الخبير');
  });

  it('shows a phone-number-shaped name as the generic role label (W3)', () => {
    const phoneNumbered: ReportTrackerDetails = {
      ...UNDER_REVIEW,
      expert: { name: '+201010000008', specialty: 'خبيرة ري' },
    };
    const view = buildTrackerView(BASE_REPORT, phoneNumbered);
    const node3 = view.find(n => n.node === 3);

    expect(node3?.chips[0].label).toBe('الخبير المسؤول عن البلاغ\nخبيرة ري');
  });

  it('omits the specialty line entirely when the wire supplies none, no trailing blank line', () => {
    const noSpecialty: ReportTrackerDetails = {
      ...UNDER_REVIEW,
      expert: { name: 'سارة محمود', specialty: '' },
    };
    const view = buildTrackerView(BASE_REPORT, noSpecialty);
    const node3 = view.find(n => n.node === 3);

    expect(node3?.chips[0].label).toBe('سارة محمود');
  });

  it("drops the reassignment note's leading separator when there is no specialty to join it to", () => {
    const reassignedNoSpecialty: ReportTrackerDetails = {
      ...UNDER_REVIEW,
      expert: { name: 'محمد عمرو', specialty: '' },
      expertReassigned: true,
    };
    const view = buildTrackerView(BASE_REPORT, reassignedNoSpecialty);
    const node3 = view.find(n => n.node === 3);

    expect(node3?.chips[0].label).toBe('محمد عمرو\nتم إعادة تعيين الخبير');
  });
});

describe('reopenedMarker', () => {
  it('returns the معاد فتحها marker only when the case is reopened', () => {
    const marker = reopenedMarker({ ...UNDER_REVIEW, reopened: true });

    expect(marker?.label).toBe('معاد فتحها');
    expect(marker?.icon).toBeTruthy();
    expect(reopenedMarker(UNDER_REVIEW)).toBeNull();
  });
});

describe('buildActiveCardSlot (F-07)', () => {
  it('surfaces the expert chip at node 3', () => {
    const slot = buildActiveCardSlot(UNDER_REVIEW);
    expect(slot).toEqual({
      kind: 'chip',
      chip: expect.objectContaining({ label: expect.stringContaining('سارة محمود') }),
    });
  });

  it('surfaces the approval slot once node 6 is open', () => {
    const openNode6: ReportTrackerDetails = {
      reportId: '1037',
      status: 'Repaired',
      hasExpertReview: true,
      repair: {
        confirmedAt: '2026-06-14T09:41:00Z',
        notes: 'x',
        photoUrl: 'https://example.com/r.jpg',
      },
    };
    expect(buildActiveCardSlot(openNode6)).toEqual({ kind: 'approval' });
  });

  it('shows nothing once the case is closed', () => {
    const closed: ReportTrackerDetails = { reportId: '1020', status: 'completed' };
    expect(buildActiveCardSlot(closed)).toBeNull();
  });
});

describe('activeCardStep', () => {
  it('reads the same node the model would place the case at', () => {
    expect(activeCardStep(UNDER_REVIEW)).toBe(3);
  });
});
