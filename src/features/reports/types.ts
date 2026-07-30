// camelCase on the wire: a bare AddControllers() gives System.Text.Json the Web defaults.
// Enum values keep their casing, because the server maps those with .ToString().

import type { PickedImage } from '@/types/image';

export type ReportStatus = 'Pending' | 'Analyzed' | 'Escalated' | 'Dismissed';

export type Severity =
  | 'Unknown'
  | 'Negligible'
  | 'VeryMinor'
  | 'Minor'
  | 'Low'
  | 'Medium'
  | 'High'
  | 'VeryHigh'
  | 'Critical'
  | 'VeryCritical';

export type ReportAttachmentType = 'Photo' | 'Voice';

export type AiAnalysis = {
  /** The model's English problem code, e.g. "Canal blockage". */
  problemName: string;
  /** What the farmer is actually shown. Nullable on the server. */
  problemArabic?: string;
  /** 0 to 1, but only because normalizeConfidence folds the server's two forms into it. */
  confidence: number;
  severity: Severity;
  recommendation: string;
  /** Nullable on the server. */
  explanation?: string;
  repairSteps: string[];
  /** Always empty: ReportService hardcodes it and the model sends none. */
  modelVersion: string;
  createdAt: string;
};

export type ReportAttachment = {
  id: string;
  type: ReportAttachmentType;
  url: string;
  createdAt: string;
};

export type Report = {
  id: string;
  description?: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt?: string;
  reporterId: string;
  latitude?: number;
  longitude?: number;
  attachments: ReportAttachment[];
  /** Undefined until the report has been analyzed. */
  analysis?: AiAnalysis;
};

export type CreateReportFields = {
  photo: PickedImage;
  description?: string;
  latitude?: number;
  longitude?: number;
};

/** Typing services/index.ts as this is what stops the mock promising data the server won't. */
export type ReportApi = {
  createReport: (fields: CreateReportFields) => Promise<Report>;
  analyzeReport: (reportId: string) => Promise<Report>;
  getMyReports: () => Promise<Report[]>;
  getReportById: (reportId: string) => Promise<Report>;
  deleteReport: (reportId: string) => Promise<void>;
};

/** Not a backend concept: the server only ever receives the resulting file. */
export type CaptureMode = 'camera' | 'upload';
