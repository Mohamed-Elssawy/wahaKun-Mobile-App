// In-memory ReportApi for when no ReportService is reachable; ./index.ts picks one.
import type { PickedImage } from '@/types/image';

import type { AiAnalysis, AiAnalysisResult, CreateIssueFields, Report } from '../types';

/** Only consulted when ESCALATE_LOW_CONFIDENCE is on, so turning it back on needs no number. */
export const CONFIDENCE_THRESHOLD = 0.8;

const REPORTER_ID = '8f1c2b1e-0000-4000-8000-000000000001';

function delay(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

/** Tuned so loading states are actually visible in dev. */
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

// Seeded so every My Issues state is reachable without filing a report first.
const SEED: Report[] = [
  {
    id: '1001',
    title: 'انسداد في القناة',
    description: 'الماء لا يصل إلى الأرض الشمالية منذ يومين.',
    status: 'Diagnosed',
    createdAt: '2026-07-22T07:14:00Z',
    updatedAt: '2026-07-22T07:14:38Z',
    reporterId: REPORTER_ID,
    latitude: 29.2041,
    longitude: 25.5195,
    attachments: [
      {
        id: 'a-2001',
        type: 'Photo',
        url: 'https://picsum.photos/seed/wahakun-canal/900/675',
        createdAt: '2026-07-22T07:14:00Z',
      },
    ],
    analysis: CANAL_BLOCKAGE,
  },
  {
    id: '1002',
    title: 'تسريب محتمل في الأنبوب',
    description: 'تسريب حول الأنبوب الرئيسي.',
    status: 'Scheduled',
    createdAt: '2026-07-21T16:02:00Z',
    updatedAt: '2026-07-21T16:02:41Z',
    reporterId: REPORTER_ID,
    latitude: 29.2077,
    longitude: 25.5231,
    attachments: [
      {
        id: 'a-2002',
        type: 'Photo',
        url: 'https://picsum.photos/seed/wahakun-pipe/900/675',
        createdAt: '2026-07-21T16:02:00Z',
      },
    ],
    analysis: {
      filePath: 'reportimage/mock-pipe.jpg',
      problemName: 'Pipe_Damage',
      problemArabic: 'تسريب محتمل في الأنبوب',
      confidence: 0.62,
      severity: 'متوسطة',
      recommendation: 'افحص وصلات الأنبوب وأعد إحكام الأطواق المرتخية.',
      explanation:
        'تظهر رطوبة حول وصلة الأنبوب الرئيسي، لكن الصورة غير واضحة بدرجة كافية لتأكيد مصدر التسريب.',
      repairSteps: [
        'أغلق محبس الأنبوب الرئيسي قبل الفحص.',
        'جفف محيط الوصلة وراقبها بضع دقائق لتحديد مصدر التسريب.',
      ],
      modelVersion: '',
      createdAt: '2026-07-21T16:02:41Z',
    },
  },
  {
    id: '1003',
    title: 'تسريب في القناة الفرعية',
    status: 'Completed',
    createdAt: '2026-07-20T05:48:00Z',
    reporterId: REPORTER_ID,
    latitude: 29.2012,
    longitude: 25.5164,
    attachments: [
      {
        id: 'a-2003',
        type: 'Photo',
        url: 'https://picsum.photos/seed/wahakun-field/900/675',
        createdAt: '2026-07-20T05:48:00Z',
      },
    ],
    analysis: {
      ...CANAL_BLOCKAGE,
      severity: 'منخفضة',
      createdAt: '2026-07-20T05:48:30Z',
    },
  },
];

let reports: Report[] = [...SEED];
let nextId = 1004;

// Alternates, so building against the mock exercises both confidence branches.
let returnHighConfidence = true;

export async function analyzeIssue(photo: PickedImage): Promise<AiAnalysisResult> {
  await delay(LATENCY.analyze);

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
  await delay(LATENCY.create);

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
  await delay(LATENCY.read);
  return [...reports].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getReportById(reportId: string): Promise<Report> {
  await delay(LATENCY.read);

  const found = reports.find(report => report.id === reportId);
  if (!found) {
    throw new Error(`Mock: no report with id ${reportId}`);
  }
  return found;
}

export async function deleteReport(reportId: string): Promise<void> {
  await delay(LATENCY.read);
  reports = reports.filter(report => report.id !== reportId);
}

/** Restores the seeded data. Useful from a dev screen or a test. */
export function resetMockReports() {
  reports = [...SEED];
  nextId = 1004;
  returnHighConfidence = true;
}
