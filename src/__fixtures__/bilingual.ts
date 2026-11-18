// Author-supplied content stays Arabic in both locales; only the chrome changes language (L-AS-AUTHORED).

import type { MapIssue } from '@/features/map/types';
import type { Report, ReportTrackerDetails } from '@/features/reports/types';

/** F-06 · pending-approval: node 6 current, the repair published, the farmer yet to answer. */
export const PENDING_APPROVAL_REPORT: Report = {
  id: '1037',
  status: 'Repaired',
  createdAt: '2026-06-03T09:41:00Z',
  reporterId: 'farmer-1',
  attachments: [
    {
      id: 'a-1',
      type: 'Photo',
      url: 'https://example.com/p.jpg',
      createdAt: '2026-06-03T09:41:00Z',
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
    createdAt: '2026-06-03T09:41:00Z',
  },
};

export const PENDING_APPROVAL_DETAILS: ReportTrackerDetails = {
  reportId: '1037',
  status: 'Repaired',
  hasExpertReview: true,
  expert: { name: 'سارة محمود', specialty: 'خبيرة ري' },
  assignedAt: '2026-06-03T10:00:00Z',
  reviewedAt: '2026-06-10T17:32:00Z',
  appointment: {
    confirmedAt: '2026-06-10T20:07:00Z',
    date: '2026-06-14',
    windowStart: '09:00',
    windowEnd: '12:00',
  },
  repair: {
    confirmedAt: '2026-06-14T09:41:00Z',
    notes: 'تم تبطين الجزء التالف من القناة بمادة عازلة و إيقاف التسرب بالكامل.',
  },
};

/** One F-05 pin, for the peek card. */
export const MAP_ISSUE: MapIssue = {
  id: 'm-1',
  title: 'تسريب كبير في القناة الرئيسية قرب مزرعة النخيل',
  latitude: 29.2041,
  longitude: 25.5195,
  status: 'Reported',
  tier: 'critical',
  createdAt: '2026-06-14T06:20:00Z',
};
