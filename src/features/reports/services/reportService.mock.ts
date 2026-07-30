// In-memory ReportApi: no ReportService instance is reachable. ./index.ts picks one.
// Divergence on purpose: create returns Pending, though the real one analyses inline.
import { ESCALATE_LOW_CONFIDENCE } from '@/config/env';

import type { AiAnalysis, CreateReportFields, Report } from '../types';

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
  problemName: 'Canal blockage',
  problemArabic: 'انسداد في القناة',
  confidence: 0.91,
  severity: 'High',
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
    id: 'r-1001',
    description: 'الماء لا يصل إلى الأرض الشمالية منذ يومين.',
    status: 'Analyzed',
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
    id: 'r-1002',
    description: 'تسريب حول الأنبوب الرئيسي.',
    // Under the threshold and Analyzed anyway, which is what the gate being off means.
    status: 'Analyzed',
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
      problemName: 'Possible pipe leak',
      problemArabic: 'تسريب محتمل في الأنبوب',
      confidence: 0.62,
      severity: 'Medium',
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
    id: 'r-1003',
    status: 'Pending',
    createdAt: '2026-07-20T05:48:00Z',
    reporterId: REPORTER_ID,
    attachments: [
      {
        id: 'a-2003',
        type: 'Photo',
        url: 'https://picsum.photos/seed/wahakun-field/900/675',
        createdAt: '2026-07-20T05:48:00Z',
      },
    ],
  },
];

let reports: Report[] = [...SEED];
let nextId = 1004;

// Alternates, so building against the mock exercises both confidence branches.
let returnHighConfidence = true;

export async function createReport(fields: CreateReportFields): Promise<Report> {
  await delay(LATENCY.create);

  const now = new Date().toISOString();
  const report: Report = {
    id: `r-${nextId++}`,
    description: fields.description,
    status: 'Pending',
    createdAt: now,
    reporterId: REPORTER_ID,
    latitude: fields.latitude,
    longitude: fields.longitude,
    attachments: [
      {
        id: `a-${nextId}`,
        type: 'Photo',
        // The real backend returns a storage URL; a local file URI renders the same.
        url: fields.photo.uri,
        createdAt: now,
      },
    ],
  };

  reports = [report, ...reports];
  return report;
}

export async function analyzeReport(reportId: string): Promise<Report> {
  await delay(LATENCY.analyze);

  const existing = reports.find(report => report.id === reportId);
  if (!existing) {
    throw new Error(`Mock: no report with id ${reportId}`);
  }

  const confidence = returnHighConfidence ? 0.91 : 0.62;
  returnHighConfidence = !returnHighConfidence;

  const now = new Date().toISOString();
  const analyzed: Report = {
    ...existing,
    // With the gate off this only ever resolves to Analyzed. Nothing produces Escalated.
    status:
      ESCALATE_LOW_CONFIDENCE && confidence < CONFIDENCE_THRESHOLD
        ? 'Escalated'
        : 'Analyzed',
    updatedAt: now,
    analysis: { ...CANAL_BLOCKAGE, confidence, createdAt: now },
  };

  reports = reports.map(report => (report.id === reportId ? analyzed : report));
  return analyzed;
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
