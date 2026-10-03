// In-memory ReportApi for when no ReportService is reachable; ./index.ts picks one.
import { emptyOnEmptyScenario, failOnErrorScenario, mockDelay } from '@/api/mockScenario';
import type { PickedImage } from '@/types/image';

import type { AiAnalysis, AiAnalysisResult, CreateIssueFields, Report } from '../types';

/** Only consulted when ESCALATE_LOW_CONFIDENCE is on, so turning it back on needs no number. */
export const CONFIDENCE_THRESHOLD = 0.8;

const REPORTER_ID = '8f1c2b1e-0000-4000-8000-000000000001';

/** Device-clock relative, like `reportTracker.mock.ts`'s `minutesAgo` - #2010's "filed six days
 * ago" has to stay true no matter when this is demoed, since it walks the E-03 window boundary. */
function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60_000).toISOString();
}

/** Tuned so loading states are actually visible in dev; 'slow' stretches these further. */
const LATENCY = {
  read: 600,
  create: 900,
  /** The flow promises "typically under three seconds", so sit near that limit. */
  analyze: 2200,
} as const;

const CANAL_BLOCKAGE: AiAnalysis = {
  filePath: 'reportimage/mock-canal.jpg',
  problemName: 'Blockage',
  problemArabic: 'انسداد في القناة',
  confidence: 0.91,
  // Arabic, matching what the vision service actually sends.
  severity: 'حرجة',
  recommendation: 'إزالة الحشائش والرواسب المتراكمة في مجرى القناة خلال 48 ساعة.',
  explanation:
    'تُظهر الصورة تراكم حشائش ورواسب طينية تسد أكثر من نصف عرض القناة، ما يقلل تدفق المياه إلى الأراضي الواقعة بعدها ويزيد فقد المياه بالتبخر.',
  repairSteps: [
    'أوقف تدفق المياه من البوابة الرئيسية قبل البدء.',
    'أزل الحشائش والرواسب يدويًا أو بمجرفة على طول المقطع المسدود.',
    'افحص جانبي القناة وأصلح أي تآكل في الجسور الترابية.',
    'أعد تشغيل التدفق تدريجيًا وتأكد من انتظام سطح الماء.',
  ],
  // Empty because the server hardcodes it, and a real-looking value would mislead.
  modelVersion: '',
  createdAt: '2026-07-22T07:14:38Z',
};

/**
 * Seeded so every My Issues state is reachable without filing a report first - and, since
 * `reportTracker.mock.ts` keys its fixtures to these same ids, so every F-06 named state is
 * reachable from a real card in the list rather than only by id.
 */
const SEED: Report[] = [
  // escalated - node 3 is current (T3 auto-routes regardless of confidence); node 2's chip is
  // the escalation line rather than a confidence pill, because this one is < 80%.
  {
    id: '1050',
    title: 'صوت غير معتاد',
    description: 'يوجد صوت غريب من المضخة ولا أعرف السبب بالضبط.',
    status: 'Assigned',
    createdAt: '2026-07-23T06:20:00Z',
    updatedAt: '2026-07-23T06:50:00Z',
    reporterId: REPORTER_ID,
    latitude: 29.2098,
    longitude: 25.5142,
    attachments: [
      {
        id: 'a-1050',
        type: 'Photo',
        url: 'https://picsum.photos/seed/wahakun-pump/900/675',
        createdAt: '2026-07-23T06:20:00Z',
      },
    ],
    analysis: {
      filePath: 'reportimage/mock-pump.jpg',
      problemName: 'Unclear',
      problemArabic: 'عطل محتمل في المضخة',
      confidence: 0.64,
      severity: 'متوسطة',
      recommendation: 'لا يمكن تأكيد السبب من الصورة وحدها.',
      explanation: 'الصورة غير واضحة بدرجة كافية لتحديد مصدر الصوت أو العطل.',
      repairSteps: [],
      modelVersion: '',
      createdAt: '2026-07-23T06:20:30Z',
    },
  },
  // reviewing - node 3. Matches the V2 export verbatim: #1043, سارة محمود, 91%.
  {
    id: '1043',
    title: 'تسريب كبير في القناة الرئيسية — قرب مزرعة النخيل',
    description: 'تسريب كبير في القناة الرئيسية — قرب مزرعة النخيل',
    status: 'Assigned',
    createdAt: '2026-06-10T09:41:00Z',
    updatedAt: '2026-06-10T17:32:00Z',
    reporterId: REPORTER_ID,
    latitude: 29.2041,
    longitude: 25.5195,
    attachments: [
      {
        id: 'a-1043',
        type: 'Photo',
        url: 'https://picsum.photos/seed/wahakun-canal/900/675',
        createdAt: '2026-06-10T09:41:00Z',
      },
    ],
    analysis: { ...CANAL_BLOCKAGE, createdAt: '2026-06-10T09:41:00Z' },
  },
  // scheduling - node 4. Matches the F-07 export: #1040, orange/متوسطة top border.
  {
    id: '1040',
    title: 'انخفاض ضغط المياه في القطاع الشرقي',
    description: 'ضغط المياه ضعيف جداً في القطاع الشرقي منذ أربعة أيام.',
    status: 'Assigned',
    createdAt: '2026-06-06T08:00:00Z',
    updatedAt: '2026-06-10T20:07:00Z',
    reporterId: REPORTER_ID,
    latitude: 29.2077,
    longitude: 25.5231,
    attachments: [
      {
        id: 'a-1040',
        type: 'Photo',
        url: 'https://picsum.photos/seed/wahakun-pump-station/900/675',
        createdAt: '2026-06-06T08:00:00Z',
      },
    ],
    analysis: {
      filePath: 'reportimage/mock-pump-station.jpg',
      problemName: 'Pressure_Drop',
      problemArabic: 'انخفاض ضغط المياه في القطاع الشرقي',
      confidence: 0.88,
      severity: 'متوسطة',
      recommendation: 'فحص محطة الضخ والصمامات الرئيسية في القطاع الشرقي.',
      explanation:
        'انخفاض تدريجي في الضغط على مدى عدة أيام يشير إلى تسريب أو انسداد جزئي.',
      repairSteps: ['فحص الصمامات الرئيسية.', 'قياس الضغط عند محطة الضخ.'],
      modelVersion: '',
      createdAt: '2026-06-06T08:00:30Z',
    },
  },
  // resolving - node 5. Appointment confirmed, repair not yet done.
  {
    id: '1035',
    title: 'كسر في خط الأنابيب الفرعي بجانب الحقل الشرقي',
    description: 'كسر واضح في الأنبوب الفرعي، المياه تتجمع في الحقل المجاور.',
    status: 'Scheduled',
    createdAt: '2026-06-12T07:15:00Z',
    updatedAt: '2026-06-13T10:00:00Z',
    reporterId: REPORTER_ID,
    latitude: 29.2065,
    longitude: 25.5178,
    attachments: [
      {
        id: 'a-1035',
        type: 'Photo',
        url: 'https://picsum.photos/seed/wahakun-broken-pipe/900/675',
        createdAt: '2026-06-12T07:15:00Z',
      },
    ],
    analysis: {
      filePath: 'reportimage/mock-broken-pipe.jpg',
      problemName: 'Pipe_Break',
      problemArabic: 'كسر في الأنبوب الفرعي',
      confidence: 0.95,
      severity: 'حرجة',
      recommendation: 'استبدال الجزء المكسور من الأنبوب خلال 24 ساعة.',
      explanation: 'كسر كامل في جدار الأنبوب يسبب فقد مياه مستمر.',
      repairSteps: ['أغلق محبس التغذية الفرعي.', 'استبدل الجزء المكسور.'],
      modelVersion: '',
      createdAt: '2026-06-12T07:15:30Z',
    },
  },
  // pending-approval - node 6, open. Matches the F-07 export: #1037, blue/منخفضة top border.
  {
    id: '1037',
    title: 'تسريب في أنبوب التغذية الجانبي',
    description: 'تسريب بسيط عند وصلة أنبوب التغذية الجانبي.',
    status: 'Repaired',
    createdAt: '2026-06-03T09:00:00Z',
    updatedAt: '2026-06-14T09:41:00Z',
    reporterId: REPORTER_ID,
    latitude: 29.2012,
    longitude: 25.5164,
    attachments: [
      {
        id: 'a-1037',
        type: 'Photo',
        url: 'https://picsum.photos/seed/wahakun-sidepipe/900/675',
        createdAt: '2026-06-03T09:00:00Z',
      },
    ],
    analysis: {
      ...CANAL_BLOCKAGE,
      problemName: 'Pipe_Leak',
      problemArabic: 'تسريب في أنبوب التغذية الجانبي',
      severity: 'منخفضة',
      createdAt: '2026-06-03T09:00:30Z',
    },
  },
  // resolved - closed by the farmer's own tap (T7).
  {
    id: '1020',
    title: 'تسريب في القناة الفرعية الغربية',
    status: 'Completed',
    createdAt: '2026-06-08T05:48:00Z',
    updatedAt: '2026-06-11T08:00:00Z',
    reporterId: REPORTER_ID,
    latitude: 29.2012,
    longitude: 25.5164,
    attachments: [
      {
        id: 'a-1020',
        type: 'Photo',
        url: 'https://picsum.photos/seed/wahakun-field/900/675',
        createdAt: '2026-06-08T05:48:00Z',
      },
    ],
    analysis: {
      ...CANAL_BLOCKAGE,
      problemArabic: 'تسريب في القناة الفرعية الغربية',
      severity: 'منخفضة',
      createdAt: '2026-06-08T05:48:30Z',
    },
  },
  // Shared with expertService.mock.ts and reportTracker.mock.ts under the same id, filed six
  // days ago: the one case that walks E-03's window boundary and shows the expert's T5/T6
  // writes landing live on this farmer's own F-06 (S4's cross-role DoD check).
  {
    id: '2010',
    title: 'تشقق في جدار القناة الجنوبية قرب محطة الضخ',
    description: 'ظهر تشقق صغير منذ أسبوع وبدأ يتسرب منه الماء ببطء.',
    status: 'Assigned',
    createdAt: daysAgo(6),
    updatedAt: daysAgo(5),
    reporterId: REPORTER_ID,
    latitude: 29.2055,
    longitude: 25.5168,
    attachments: [
      {
        id: 'a-2010',
        type: 'Photo',
        url: 'https://picsum.photos/seed/wahakun-2010/900/675',
        createdAt: daysAgo(6),
      },
    ],
    analysis: {
      filePath: 'reportimage/mock-canal-wall.jpg',
      problemName: 'Wall_Crack',
      problemArabic: 'تشقق في جدار القناة الجنوبية',
      confidence: 0.86,
      severity: 'متوسطة',
      recommendation: 'تبطين موضع التشقق بمادة عازلة قبل أن يتسع.',
      explanation: 'تشقق طولي في جدار القناة الخرسانية مصحوب بتسرب بطيء عند القاعدة.',
      repairSteps: ['تفريغ القناة جزئياً عند الموضع.', 'تبطين التشقق بمادة عازلة.'],
      modelVersion: '',
      createdAt: daysAgo(6),
    },
  },
];

let reports: Report[] = [...SEED];
let nextId = 1100;

// Alternates, so building against the mock exercises both confidence branches.
let returnHighConfidence = true;

export async function analyzeIssue(photo: PickedImage): Promise<AiAnalysisResult> {
  await mockDelay(LATENCY.analyze);

  const confidence = returnHighConfidence ? 0.91 : 0.62;
  returnHighConfidence = !returnHighConfidence;

  const {
    modelVersion: _modelVersion,
    createdAt: _createdAt,
    ...result
  } = CANAL_BLOCKAGE;

  // The real service returns the stored object key; a local file URI renders the same.
  return { ...result, confidence, filePath: photo.uri };
}

export async function createIssue(fields: CreateIssueFields): Promise<Report> {
  await mockDelay(LATENCY.create);

  const { analysis, description, latitude, longitude } = fields;
  const now = new Date().toISOString();

  const report: Report = {
    id: `r-${nextId++}`,
    title: analysis.problemArabic || analysis.problemName,
    description,
    // create files the issue already diagnosed; there is no unanalysed state any more.
    status: 'Diagnosed',
    createdAt: now,
    reporterId: REPORTER_ID,
    latitude,
    longitude,
    attachments: [
      {
        id: `a-${nextId}`,
        type: 'Photo',
        url: analysis.filePath,
        createdAt: now,
      },
    ],
    analysis: { ...analysis, modelVersion: '', createdAt: now },
  };

  reports = [report, ...reports];
  return report;
}

export async function getMyReports(): Promise<Report[]> {
  await mockDelay(LATENCY.read);
  failOnErrorScenario('تعذر تحميل البلاغات');

  const sorted = [...reports].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return [...emptyOnEmptyScenario(sorted)];
}

export async function getReportById(reportId: string): Promise<Report> {
  await mockDelay(LATENCY.read);
  failOnErrorScenario('تعذر تحميل البلاغ');

  const found = reports.find(report => report.id === reportId);
  if (!found) {
    throw new Error(`Mock: no report with id ${reportId}`);
  }
  return found;
}

export async function deleteReport(reportId: string): Promise<void> {
  await mockDelay(LATENCY.read);
  reports = reports.filter(report => report.id !== reportId);
}

/** Restores the seeded data. Useful from a dev screen or a test. */
export function resetMockReports() {
  reports = [...SEED];
  nextId = 1100;
  returnHighConfidence = true;
}
