// camelCase on the wire from the Web defaults; enum values keep their casing.

import type { PickedImage } from '@/types/image';

import type { ReportErrorKind } from './errors';

/** IssueStatus in C#. The converter is registered, so it arrives as a name as well as an int. */

/** Where the farmer stood when filing. Both or neither: half a coordinate places nothing. */
export type ReportLocation = { latitude: number; longitude: number };

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

/** The analyze response, posted back verbatim to create. Do not reshape it before create. */
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

/** What F-03a and E-11 draw: the two wire shapes differ, the screen does not. */
export type DiagnosisContent = {
  title: string;
  severity: Severity;
  /** 0 to 1, already normalized. */
  confidence: number;
  recommendation?: string;
  repairSteps: string[];
  explanation?: string;
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
  /** The row's own priority, mapped: the only severity a بلاغاتي row has. */
  severity?: Severity;
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

/** The thirteen fields GET /Farmer/issues/{reporterId} returns, rebuilt from PROBE C2. */
export type GetFarmerIssuesWire = {
  issueId: string;
  title: string;
  description: string;
  /** Naive `datetime2`, no offset. Node 1 of the tracker timeline is dated from here. */
  createdAt: string;
  /** Arrives as a name; both forms are typed because the deployment has reverted before. */
  status: IssueStatusCode | ReportStatus;
  /** IssuePriority as a name. Present on every row and deliberately not rendered. */
  priority: string;
  /** The backend's misspelling of `latitude`, one `t`. The wire's, not ours - do not correct it. */
  latiude: string;
  /** Spelled correctly here, unlike `latiude` and unlike the map DTO's `longitde`. */
  longitude: string;
  reporterId: string;
  /** G12: null on every row, because GetFarmerIssuesSpecs never includes the expert. Item 17. */
  expertName: string | null;
  expertUrl: string | null;
  expertId: string;
  /** Object key as the 13 October probe read it. Optional because older servers omit it. */
  imageUrl?: string | null;
  /** The same photo as e98684f declares it; read through farmerIssuePhotoKey, never directly. */
  imagegurl?: string | null;
  /** The same photo again, as 92b621c corrected it: a single key rather than a collection. */
  imageurl?: string | null;
};

/** PaginatedResult<T>, the envelope 92b621c answers with. Read through farmerIssueRows. */
export type FarmerIssuesPageWire = {
  pageIndex: number;
  pageCount: number;
  totalCount: number;
  results: GetFarmerIssuesWire[];
};

/** steps[] is StatusHistory, newest first, with no Pending rows and no Reported row. */
export type IssueTrackingWire = {
  issueId: string;
  currentStatus: IssueStatusCode | ReportStatus;
  steps: {
    status: IssueStatusCode | ReportStatus;
    /** English audit string from a server-side switch. Never rendered; labels key off status. */
    name: string;
    /** 0 Pending, 1 Current, 2 Completed - or the names `"Pending"`/`"Current"`/`"Completed"`. */
    state: 0 | 1 | 2 | 'Pending' | 'Current' | 'Completed';
    /** Naive `datetime2`, no offset, so it goes through `toUtcTimestamp`. Nullable on the wire. */
    changedAt: string | null;
    /** A server-written English audit line ("Issue Repaired by expert"). Never farmer-facing. */
    note: string | null;
    expertId: string | null;
    /** N1: the expert's phone number, not a display name. See item 26. */
    expertName: string | null;
    expertPhoto: string | null;
    repairPhoto: string | null;
  }[];
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
  /** The server's specific Arabic reason, shown instead of the generic copy. */
  failureMessage?: string;
  /** Last transient failure, so the row can say why it is still waiting. */
  lastError?: string;
};

/** A union because queued items have no server id, status or attachments. */
export type ReportListItem =
  { kind: 'queued'; queued: QueuedReport } | { kind: 'server'; report: Report };

/** PROPOSED in full: IssueController has no read endpoint, so none of nodes 3-6 exists yet. */
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

/** Both halves optional: a repair with neither a time nor a photo is still a repair. */
export type TrackerRepair = {
  /** D5. Undefined when `StatusHistory` carried no `changedAt`; never `new Date()`. */
  confirmedAt?: string;
  notes: string;
  /** D6. Undefined when the repair was published with no photo, which does not undo it. */
  photoUrl?: string;
};

/** What the selectors need beyond the wire status, plus each node's chip payload. */
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
  /** Mock-only: a boolean, not a status, since the server can never send معاد فتحها (G2). */
  reopened?: boolean;
  /** Mock-only: no wire signal exists for a reassignment, and no notifications contract either. */
  expertReassigned?: boolean;
};

/** Typing services/index.ts as this is what stops the mock promising data the server won't. */
export type ReportApi = {
  /** The coordinate rides on analyze: its Hangfire job is what files the issue's GPSLocation. */
  analyzeIssue: (
    photo: PickedImage,
    location?: ReportLocation,
  ) => Promise<AiAnalysisResult>;
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

/** X-02's copy variant, not the same set as CaptureMode: text is reached from voice mode. */
export type AnalyzingMode = 'photo' | 'voice' | 'text';
