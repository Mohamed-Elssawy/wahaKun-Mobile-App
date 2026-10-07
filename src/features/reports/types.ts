// camelCase on the wire from the Web defaults; enum values keep their casing.

import type { PickedImage } from '@/types/image';

import type { ReportErrorKind } from './errors';

/** IssueStatus in C#. No JsonStringEnumConverter is registered, so it arrives as an int. */
export type IssueStatusCode = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type ReportStatus =
  | 'Reported'
  | 'Diagnosed'
  // No backend sends this; nothing in the solution ever assigns it.
  | 'Verified'
  | 'Assigned'
  | 'Reviewed'
  | 'Scheduled'
  | 'Repaired'
  // Lowercase in the C# source - `.ToString()` emits "completed", not "Completed".
  | 'completed';

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

/**
 * `GetFarmerIssues`, the one row shape `GET /Farmer/issues/{reporterId}` returns - §4.3.
 * Much narrower than a `Report`: no severity or priority, no attachments, no AI analysis and
 * no status history, which is why F-06 still reads from the mock (§6 G9).
 */
export type GetFarmerIssuesWire = {
  issueId: string;
  title: string;
  description: string;
  createdAt: string;
  /** An int. No JsonStringEnumConverter is registered anywhere in the solution. */
  status: IssueStatusCode;
  slotStart: string | null;
  slotEnd: string | null;
  /** Spelled this way on the wire. A backend typo, and routes and fields are matched verbatim. */
  sceduleDate: string | null;
  reporterId: string;
  expertName: string;
  expertUrl: string;
  expertId: string;
  teamName: string | null;
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
  /** Why it stopped. Never 'offline'/'temporary' (those retry) and never 'unauthorized'. */
  failureKind?: ReportErrorKind;
  /** The server's specific Arabic reason (e.g. the vision service's suggestion), shown instead of the generic copy. */
  failureMessage?: string;
  /** Last transient failure, so the row can say why it is still waiting. */
  lastError?: string;
};

/** A union because queued items have no server id, status or attachments. */
export type ReportListItem =
  { kind: 'queued'; queued: QueuedReport } | { kind: 'server'; report: Report };

/**
 * F-06. PROPOSED in full: IssueController has no read endpoint at all (BACKEND-CONTRACT-REQUESTS
 * item 3), so none of nodes 3-6's payload exists on the wire yet. Named for the person it is
 * about, not the DTO it will someday mirror, since there is no real DTO to mirror.
 */
export type TrackerExpert = {
  name: string;
  specialty: string;
};

/** §8.2 node 4. `reason` and `rescheduled` only appear once T10/T11 have run. */
export type TrackerAppointment = {
  /** T5. Node 4's done datetime - node 5's current state uses static copy, not this. */
  confirmedAt: string;
  date: string;
  windowStart: string;
  windowEnd: string;
  rescheduled?: boolean;
  reason?: string;
};

/** §8.2 node 5's payload, published by T6. */
export type TrackerRepair = {
  confirmedAt: string;
  notes: string;
  photoUrl: string;
};

/**
 * Everything `publicStepperNode`/`currentNode` need beyond the bare wire status, plus the
 * human-readable payload each node's `ContextChip` draws. `hasExpertReview` is PROPOSED the same
 * way `LifecycleFacts` already proposes it - no `IssueStatus` value separates node 3 from node 4.
 */
export type ReportTrackerDetails = {
  reportId: string;
  status: ReportStatus;
  hasExpertReview?: boolean;
  expert?: TrackerExpert;
  /** T3. Node 3's current-state relative time counts from here. */
  assignedAt?: string;
  /** T4. Node 3's done datetime and the basis for node 4's current-state relative time. */
  reviewedAt?: string;
  appointment?: TrackerAppointment;
  repair?: TrackerRepair;
  /** Node 6's closure table (§8.2): only 'farmer' is reachable from mobile; T12 has no client. */
  closedBy?: 'farmer' | 'admin';
  closedAt?: string;
};

/** Typing services/index.ts as this is what stops the mock promising data the server won't. */
export type ReportApi = {
  analyzeIssue: (photo: PickedImage) => Promise<AiAnalysisResult>;
  /** Returns a whole Report: create's own response carries neither photo nor analysis. */
  createIssue: (fields: CreateIssueFields) => Promise<Report>;
  getMyReports: () => Promise<Report[]>;
  getReportById: (reportId: string) => Promise<Report>;
  deleteReport: (reportId: string) => Promise<void>;
  /** F-06. Separate from getReportById: the tracker is scheduling/expert detail, not the report. */
  getReportTracker: (reportId: string) => Promise<ReportTrackerDetails>;
  /** T7. Refused client-side first by `attempt()`; reaching the service means it was allowed. */
  confirmResolution: (reportId: string) => Promise<void>;
  /** T8. */
  rejectResolution: (reportId: string) => Promise<void>;
};

/** The two tabs on F-02, client-only. `photo` covers capture and gallery pick alike. */
export type CaptureMode = 'photo' | 'voice';
