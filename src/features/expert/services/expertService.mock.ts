// In-memory ExpertCaseSummary/Detail for when no expert endpoint exists at all.
import { emptyOnEmptyScenario, failOnErrorScenario, mockDelay } from '@/api/mockScenario';

import type {
  ExpertCaseDetail,
  ExpertCaseSummary,
  SubmitExpertReviewFields,
} from '../types';

const LATENCY = { read: 500, write: 700 } as const;

/** Minutes/hours ago from whenever the app actually runs, same device-clock trick as the
 * F-06 tracker mock - the relative-time copy has to stay true no matter when this is demoed. */
function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60_000).toISOString();
}

/**
 * §8.3's E-01 fixtures. One per status/node split the stepper distinguishes, plus both sides
 * of the 80% threshold, a high-corroboration/low-severity mismatch (§10.3), a long title and a
 * case with no reporter avatar at all.
 */
const SUMMARIES: Record<string, ExpertCaseSummary> = {
  // New, node 1->2, high confidence: the plain جديدة card.
  '2001': {
    reportId: '2001',
    status: 'New',
    hasAiAnalysis: true,
    hasExpertReview: false,
    hasAppointment: false,
    hasRepairConfirmation: false,
    title: 'تسرب مياه من خط الري الرئيسي',
    severity: 'Critical',
    confidence: 0.92,
    corroborationCount: 2,
    reporterName: 'محمد عبد الله',
    reporterAvatar: 'https://i.pravatar.cc/150?img=12',
    createdAt: hoursAgo(2),
    photoUrl: 'https://picsum.photos/seed/wahakun-2001/900/675',
  },
  // New, below 80%: the only place the amber chip can appear.
  '2002': {
    reportId: '2002',
    status: 'New',
    hasAiAnalysis: true,
    hasExpertReview: false,
    hasAppointment: false,
    hasRepairConfirmation: false,
    title: 'ضعف ضغط المياه في القطاع الشمالي',
    severity: 'Medium',
    confidence: 0.62,
    corroborationCount: 0,
    reporterName: 'سلمى يوسف',
    reporterAvatar: 'https://i.pravatar.cc/150?img=47',
    createdAt: hoursAgo(5),
    photoUrl: 'https://picsum.photos/seed/wahakun-2002/900/675',
  },
  // Reopened: always node 3. Long title to test the header's 2-line clamp.
  '2003': {
    reportId: '2003',
    status: 'Reopened',
    hasAiAnalysis: true,
    hasExpertReview: false,
    hasAppointment: false,
    hasRepairConfirmation: false,
    title:
      'تصدع في جدار القناة الفرعية مع تسرب مستمر يزداد مساحة كل يوم قريباً من الحقل الشرقي',
    severity: 'VeryHigh',
    confidence: 0.88,
    corroborationCount: 1,
    reporterName: 'خالد إبراهيم',
    createdAt: hoursAgo(1),
  },
  // UnderReview, review not yet submitted: مراجعة current -> متابعة -> E-02.
  '2004': {
    reportId: '2004',
    status: 'UnderReview',
    hasAiAnalysis: true,
    hasExpertReview: false,
    hasAppointment: false,
    hasRepairConfirmation: false,
    title: 'انسداد جزئي في مصفاة نقطة التحويل',
    severity: 'High',
    confidence: 0.81,
    corroborationCount: 3,
    reporterName: 'فاطمة الزهراء',
    reporterAvatar: 'https://i.pravatar.cc/150?img=33',
    createdAt: hoursAgo(8),
    photoUrl: 'https://picsum.photos/seed/wahakun-2004/900/675',
  },
  // UnderReview, review submitted: الجدولة current -> متابعة -> E-03.
  '2005': {
    reportId: '2005',
    status: 'UnderReview',
    hasAiAnalysis: true,
    hasExpertReview: true,
    hasAppointment: false,
    hasRepairConfirmation: false,
    title: 'تلف في بوابة التحكم بمنسوب المياه',
    severity: 'High',
    confidence: 0.85,
    corroborationCount: 0,
    reporterName: 'يوسف منصور',
    reporterAvatar: 'https://i.pravatar.cc/150?img=22',
    createdAt: hoursAgo(20),
    photoUrl: 'https://picsum.photos/seed/wahakun-2005/900/675',
  },
  // Scheduled, repair not confirmed: تأكيد الحل current -> عرض -> E-04, + إعادة الجدولة.
  '2006': {
    reportId: '2006',
    status: 'Scheduled',
    hasAiAnalysis: true,
    hasExpertReview: true,
    hasAppointment: true,
    hasRepairConfirmation: false,
    title: 'كسر في أنبوب الصرف الثانوي',
    severity: 'Medium',
    confidence: 0.9,
    corroborationCount: 4,
    reporterName: 'عبير سامي',
    reporterAvatar: 'https://i.pravatar.cc/150?img=5',
    createdAt: hoursAgo(30),
    photoUrl: 'https://picsum.photos/seed/wahakun-2006/900/675',
  },
  // Scheduled, repair confirmed: تأكيد المزارع current -> عرض -> E-05, + إعادة الجدولة.
  '2007': {
    reportId: '2007',
    status: 'Scheduled',
    hasAiAnalysis: true,
    hasExpertReview: true,
    hasAppointment: true,
    hasRepairConfirmation: true,
    title: 'ضعف في عزل خط الري بالتنقيط',
    severity: 'Low',
    confidence: 0.77,
    corroborationCount: 1,
    reporterName: 'ليلى حسن',
    createdAt: hoursAgo(50),
  },
  // Resolved: all four nodes done -> عرض -> E-06.
  '2008': {
    reportId: '2008',
    status: 'Resolved',
    hasAiAnalysis: true,
    hasExpertReview: true,
    hasAppointment: true,
    hasRepairConfirmation: true,
    title: 'تسرب بسيط من صمام التحويل',
    severity: 'Low',
    confidence: 0.94,
    corroborationCount: 0,
    reporterName: 'أحمد ناصر',
    reporterAvatar: 'https://i.pravatar.cc/150?img=15',
    createdAt: hoursAgo(96),
  },
  // §10.3's mismatch: twelve confirmations on a case the model read as منخفضة.
  '2009': {
    reportId: '2009',
    status: 'New',
    hasAiAnalysis: true,
    hasExpertReview: false,
    hasAppointment: false,
    hasRepairConfirmation: false,
    title: 'بقعة رطوبة متكررة عند منتصف الخط الرئيسي',
    severity: 'Low',
    confidence: 0.84,
    corroborationCount: 12,
    reporterName: 'منى طارق',
    reporterAvatar: 'https://i.pravatar.cc/150?img=9',
    createdAt: hoursAgo(14),
    photoUrl: 'https://picsum.photos/seed/wahakun-2009/900/675',
  },
};

/** E-02's extra leaves, keyed the same as `SUMMARIES`. Two carry no explanation/recommendation
 * at all, which is a real server shape: analysis can be thin. */
const DETAILS: Record<string, Omit<ExpertCaseDetail, keyof ExpertCaseSummary>> = {
  '2001': {
    explanation:
      'نمط تسرب مستمر عند وصلة الأنبوب الرئيسي، يتوافق مع صور سابقة لتلف في الحشية.',
    recommendation: 'استبدال الحشية الخاصة بالوصلة وإغلاق الخط مؤقتاً أثناء الإصلاح.',
    description: 'بدأ التسرب منذ يومين وازداد بعد الأمطار الأخيرة.',
  },
  '2002': {
    // Deliberately thin: the model returned a severity and nothing else.
    description: 'لاحظت أن ضغط المياه ضعيف في الصباح فقط.',
  },
  '2003': {
    explanation: 'تصدع يتسع تدريجياً في جدار القناة، مصحوب بتسرب نشط عند القاعدة.',
    recommendation: 'تبطين الجدار بمادة عازلة وإعادة فحص القناة بعد 48 ساعة.',
    description: 'الحالة أُعيد فتحها بعد أن رفض المزارع تأكيد الإصلاح السابق.',
    previousReview: {
      severity: 'High',
      correctedDiagnosis: 'تصدع إنشائي في جدار القناة، أخطر مما قدّره النموذج.',
      expertNote: 'يحتاج الجدار دعامة إضافية قبل إغلاق الحالة.',
    },
  },
  '2004': {
    explanation:
      'انسداد جزئي بمخلفات نباتية عند نقطة التحويل، يقلل التدفق دون إيقافه بالكامل.',
    recommendation: 'تنظيف المصفاة وفحص نقطة التحويل أسبوعياً لمدة شهر.',
  },
  '2005': {
    explanation: 'تلف في مفصل البوابة يمنع إغلاقها بالكامل عند الحاجة.',
    recommendation: 'استبدال المفصل وإعادة ضبط آلية التحكم.',
    description: 'البوابة لا تغلق بشكل كامل منذ أسبوعين تقريباً.',
  },
};

// Mutable so submitReview can move a case while the app runs, same pattern as reportTracker.mock.ts.
const summaries = new Map(Object.entries(SUMMARIES));

export async function getAssignedCases(): Promise<ExpertCaseSummary[]> {
  await mockDelay(LATENCY.read);
  failOnErrorScenario('تعذر تحميل الحالات');

  return [...emptyOnEmptyScenario([...summaries.values()])];
}

export async function getCaseDetail(reportId: string): Promise<ExpertCaseDetail> {
  await mockDelay(LATENCY.read);
  failOnErrorScenario('تعذر تحميل الحالة');

  const summary = summaries.get(reportId);
  if (!summary) {
    throw new Error(`Mock: no case for report ${reportId}`);
  }

  return { ...summary, ...DETAILS[reportId] };
}

/** No real review-submit exists; this only advances the in-memory fixture so E-02's primary
 * button has somewhere to land during a demo. */
export async function submitReview(fields: SubmitExpertReviewFields): Promise<void> {
  await mockDelay(LATENCY.write);
  failOnErrorScenario('تعذر إرسال المراجعة');

  const current = summaries.get(fields.reportId);
  if (!current) {
    throw new Error(`Mock: no case for report ${fields.reportId}`);
  }

  summaries.set(fields.reportId, {
    ...current,
    // T4-equivalent: submitting the review is what moves جديدة/معاد فتحها into قيد المراجعة.
    status:
      current.status === 'New' || current.status === 'Reopened'
        ? 'UnderReview'
        : current.status,
    hasExpertReview: true,
    severity: fields.override?.severity ?? current.severity,
  });
}

/** Restores the seeded data. Useful from a dev screen or a test. */
export function resetMockExpertQueue() {
  summaries.clear();
  for (const [id, summary] of Object.entries(SUMMARIES)) {
    summaries.set(id, summary);
  }
}
