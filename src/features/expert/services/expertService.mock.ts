// In-memory ExpertCaseSummary/Detail for when no expert endpoint exists at all.
import { emptyOnEmptyScenario, failOnErrorScenario, mockDelay } from '@/api/mockScenario';
import {
  applyExpertAppointment,
  applyExpertRepair,
} from '@/features/reports/services/reportTracker.mock';

import type {
  ConfirmAppointmentFields,
  ConfirmRepairFields,
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

function daysAgo(days: number): string {
  return hoursAgo(days * 24);
}

/** T5's slot label mapped onto the farmer tracker's windowStart/windowEnd pair. E-03 only ever
 * picks one fixed point in time, so the "window" the farmer sees collapses to that one slot. */
function slotToWindow(slot: string): { windowStart: string; windowEnd: string } {
  return { windowStart: slot, windowEnd: slot };
}

/** Local YYYY-MM-DD, offset by `days` from today - fixture dates stay relative to the device
 * clock, same reasoning as `hoursAgo`, but as a date rather than a relative-time string. */
function todayPlus(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  // Shared with reportService.mock.ts and reportTracker.mock.ts under the same id. Filed six
  // days ago so E-03's C-WINDOW boundary is walkable: day 7 of the window is today, day 8 is
  // disabled. الجدولة current -> متابعة -> E-03.
  '2010': {
    reportId: '2010',
    status: 'UnderReview',
    hasAiAnalysis: true,
    hasExpertReview: true,
    hasAppointment: false,
    hasRepairConfirmation: false,
    title: 'تشقق في جدار القناة الجنوبية قرب محطة الضخ',
    severity: 'Medium',
    confidence: 0.86,
    corroborationCount: 1,
    reporterName: 'إبراهيم الشريف',
    reporterAvatar: 'https://i.pravatar.cc/150?img=8',
    createdAt: daysAgo(6),
    photoUrl: 'https://picsum.photos/seed/wahakun-2010/900/675',
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
    // The drawn E-02 frame is toggle-ON; carrying it onto E-03's `قرار الخبير` card exercises
    // the other half of `C-OVERRIDE` that card has to render.
    currentOverride: {
      severity: 'High',
      correctedDiagnosis: 'تلف أعمق في مفصل البوابة من تقدير النموذج، يتطلب استبداله بالكامل.',
    },
  },
  // Scheduled, repair not confirmed: entry point for E-04 straight from E-01's عرض.
  '2006': {
    explanation: 'كسر جزئي في جدار الأنبوب الثانوي عند نقطة التفريغ.',
    recommendation: 'استبدال الجزء المكسور وفحص الأنابيب المجاورة.',
    appointment: { date: todayPlus(1), slot: '9:00 ص', noteToFarmer: 'سأحتاج للوصول إلى محبس الصرف الجانبي.' },
  },
  // Scheduled, repair confirmed: entry point for E-05 straight from E-01's عرض.
  '2007': {
    appointment: { date: todayPlus(-2), slot: '11:00 ص' },
    repair: {
      photoUrl: 'https://picsum.photos/seed/wahakun-2007-repair/900/675',
      notes: 'تم تبطين خط الري بالتنقيط واستبدال الوصلة التالفة.',
    },
  },
  // Resolved: entry point for E-06 straight from E-01's عرض.
  '2008': {
    appointment: { date: todayPlus(-5), slot: '7:00 ص' },
    repair: {
      photoUrl: 'https://picsum.photos/seed/wahakun-2008-repair/900/675',
      notes: 'تم استبدال صمام التحويل وإحكام الوصلات المحيطة به.',
    },
  },
  '2010': {
    explanation: 'تشقق طولي في جدار القناة الخرسانية مصحوب بتسرب بطيء عند القاعدة.',
    recommendation: 'تبطين موضع التشقق بمادة عازلة قبل أن يتسع.',
    description: 'ظهر تشقق صغير منذ أسبوع وبدأ يتسرب منه الماء ببطء.',
    // Toggle-OFF - the common, undrawn default: no override, proceeding with the AI's own call.
  },
};

// Mutable so submitReview can move a case while the app runs, same pattern as reportTracker.mock.ts.
const summaries = new Map(Object.entries(SUMMARIES));
// Mutable too: submitReview/confirmAppointment/confirmRepair all write a leaf getCaseDetail reads back.
const details = new Map(Object.entries(DETAILS));

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

  return { ...summary, ...details.get(reportId) };
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

  // E-03's `قرار الخبير` card reads this back; undefined when the toggle was OFF.
  details.set(fields.reportId, {
    ...details.get(fields.reportId),
    currentOverride: fields.override,
  });
}

/** T5. Moves node 4 -> 5 and writes the appointment both sides read back - E-01's مجدولة
 * cards, E-04/E-05/E-06, and (through the tracker's write-through) the matching farmer F-06. */
export async function confirmAppointment(fields: ConfirmAppointmentFields): Promise<void> {
  await mockDelay(LATENCY.write);
  failOnErrorScenario('تعذر تأكيد الجدولة');

  const current = summaries.get(fields.reportId);
  if (!current) {
    throw new Error(`Mock: no case for report ${fields.reportId}`);
  }

  summaries.set(fields.reportId, { ...current, status: 'Scheduled', hasAppointment: true });
  details.set(fields.reportId, {
    ...details.get(fields.reportId),
    appointment: { date: fields.date, slot: fields.slot, noteToFarmer: fields.noteToFarmer },
  });

  applyExpertAppointment(fields.reportId, {
    date: fields.date,
    ...slotToWindow(fields.slot),
  });
}

/** T6. Moves node 5 -> 6 and writes the repair payload. The photo is never actually uploaded
 * here - there is nowhere real to send it - the mock just keeps the picked image's own uri. */
export async function confirmRepair(fields: ConfirmRepairFields): Promise<void> {
  await mockDelay(LATENCY.write);
  failOnErrorScenario('تعذر تأكيد الحل');

  const current = summaries.get(fields.reportId);
  if (!current) {
    throw new Error(`Mock: no case for report ${fields.reportId}`);
  }

  const repair = { photoUrl: fields.photo.uri, notes: fields.notes };

  summaries.set(fields.reportId, { ...current, hasRepairConfirmation: true });
  details.set(fields.reportId, { ...details.get(fields.reportId), repair });

  applyExpertRepair(fields.reportId, repair);
}

/** Restores the seeded data. Useful from a dev screen or a test. */
export function resetMockExpertQueue() {
  summaries.clear();
  for (const [id, summary] of Object.entries(SUMMARIES)) {
    summaries.set(id, summary);
  }

  details.clear();
  for (const [id, detail] of Object.entries(DETAILS)) {
    details.set(id, detail);
  }
}
