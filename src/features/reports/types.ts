// camelCase on the wire from the Web defaults; enum values keep their casing.

import type { PickedImage } from '@/types/image';

import type { ReportErrorKind } from './errors';

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

/** `CreateReportResponse`, not a `Report`: create files the row and analysis is a separate call. */
export type CreatedReport = {
  id: string;
  description?: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt?: string;
  reporterId: string;
};

export type CreateReportFields = {
  photo: PickedImage;
  description?: string;
  latitude?: number;
  longitude?: number;
  /** Sent as `IdempotencyKey`; without it a retry after a lost response files twice. */
  idempotencyKey?: string;
};

/** Re-encoded rather than referenced: the camera's cache directory may be evicted. */
export type PersistedPhoto = {
  /** JPEG bytes, base64. Stored under its own key, never inline in the queue index. */
  base64: string;
  width: number;
  height: number;
};

export type QueuedReportState = 'queued' | 'uploading' | 'failed';

/** Not a `Report`: that mirrors the C# response, so a client-only 'Queued' status would drift. */
export type QueuedReport = {
  /** Identity before the server assigns one, and the idempotency key on upload. */
  localId: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  state: QueuedReportState;
  attempts: number;
  /** Epoch ms. The drain passes over anything scheduled later than now. */
  nextAttemptAt: number;
  createdAt: string;
  /** Set once create succeeds. Analysis may still be outstanding. */
  serverId?: string;
  /** Why it stopped. Never 'offline' (that retries) and never 'unauthorized'. */
  failureKind?: ReportErrorKind;
};

/** A union because queued items have no server id, status or attachments. */
export type ReportListItem =
  { kind: 'queued'; queued: QueuedReport } | { kind: 'server'; report: Report };

/** Typing services/index.ts as this is what stops the mock promising data the server won't. */
export type ReportApi = {
  createReport: (fields: CreateReportFields) => Promise<CreatedReport>;
  analyzeReport: (reportId: string) => Promise<Report>;
  getMyReports: () => Promise<Report[]>;
  getReportById: (reportId: string) => Promise<Report>;
  deleteReport: (reportId: string) => Promise<void>;
};

/** The two tabs on F-02, client-only. `photo` covers capture and gallery pick alike. */
export type CaptureMode = 'photo' | 'voice';
