// camelCase on the wire from the Web defaults; enum values keep their casing.

import type { PickedImage } from '@/types/image';

import type { ReportErrorKind } from './errors';

/** IssueStatus in C#. No JsonStringEnumConverter is registered, so it arrives as an int. */
export type IssueStatusCode = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type ReportStatus =
  | 'Reported'
  | 'Diagnosed'
  | 'Verified'
  | 'Assigned'
  | 'Scheduled'
  | 'Repaired'
  | 'Completed';

/** The vision service's SeverityLevel values, which ReportService stores verbatim. */
export type ArabicSeverity =
  | 'حرجة جداً'
  | 'حرجة'
  | 'عالية جداً'
  | 'عالية'
  | 'متوسطة'
  | 'منخفضة'
  | 'بسيطة'
  | 'بسيطة جداً'
  | 'غير مؤثرة'
  | 'غير معروفة';

/** The same ten steps under their C# names. The mock speaks these; the server does not. */
export type EnglishSeverity =
  | 'VeryCritical'
  | 'Critical'
  | 'VeryHigh'
  | 'High'
  | 'Medium'
  | 'Low'
  | 'Minor'
  | 'VeryMinor'
  | 'Negligible'
  | 'Unknown';

export type Severity = ArabicSeverity | EnglishSeverity;

export type ReportAttachmentType = 'Photo' | 'Voice';

/** The api/Issue/analyze response, posted back verbatim to api/Issue/create. */
// Field names and nullability mirror AiAnalysisResponse; do not reshape it before create.
export type AiAnalysisResult = {
  /** The object key the photo was stored under. create fails without it. */
  filePath: string;
  /** The model's English problem code, e.g. "Pipe_Damage". */
  problemName: string;
  /** What the farmer is actually shown. Nullable on the server. */
  problemArabic?: string;
  /** 0 to 1, but only because normalizeConfidence folds the server's two forms into it. */
  confidence: number;
  /** Arabic, not an enum: the vision service sends SeverityLevel.value. */
  severity: Severity;
  recommendation: string;
  explanation?: string;
  repairSteps: string[];
};

export type AiAnalysis = AiAnalysisResult & {
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
  /** ReportService sets this to the analysis's Arabic problem name. */
  title?: string;
  description?: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt?: string;
  reporterId: string;
  latitude?: number;
  longitude?: number;
  attachments: ReportAttachment[];
  /** Undefined only for a report this client did not assemble itself. */
  analysis?: AiAnalysis;
};

/** The api/Issue/create response. Narrower than a Report: no attachments, no analysis. */
export type CreatedIssue = {
  id: string;
  description?: string;
  status: IssueStatusCode;
  createdAt: string;
  updatedAt?: string;
  reporterId: string;
};

/** What create needs beyond the analysis the farmer just got back. */
export type CreateIssueFields = {
  analysis: AiAnalysisResult;
  description?: string;
  latitude?: number;
  longitude?: number;
};

/** What the capture screen hands the queue. The photo is persisted, never held by reference. */
export type QueueReportFields = {
  photo: PickedImage;
  description?: string;
  latitude?: number;
  longitude?: number;
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
  /** Identity before the server assigns one. */
  localId: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  state: QueuedReportState;
  attempts: number;
  /** Epoch ms. The drain passes over anything scheduled later than now. */
  nextAttemptAt: number;
  createdAt: string;
  /** Checkpoint: analyze uploaded the photo and ran the model, so a retry skips both. */
  analysis?: AiAnalysisResult;
  /** Why it stopped. Never 'offline' (that retries) and never 'unauthorized'. */
  failureKind?: ReportErrorKind;
};

/** A union because queued items have no server id, status or attachments. */
export type ReportListItem =
  { kind: 'queued'; queued: QueuedReport } | { kind: 'server'; report: Report };

/** Typing services/index.ts as this is what stops the mock promising data the server won't. */
export type ReportApi = {
  analyzeIssue: (photo: PickedImage) => Promise<AiAnalysisResult>;
  /** Returns a whole Report: create's own response carries neither photo nor analysis. */
  createIssue: (fields: CreateIssueFields) => Promise<Report>;
  getMyReports: () => Promise<Report[]>;
  getReportById: (reportId: string) => Promise<Report>;
  deleteReport: (reportId: string) => Promise<void>;
};

/** The two tabs on F-02, client-only. `photo` covers capture and gallery pick alike. */
export type CaptureMode = 'photo' | 'voice';
