/**
 * One farmer-facing surface, two services behind it - BACKEND-INTEGRATION-FACTS.md §1:
 *
 * - `BASE`, ReportService on 5173, serves `POST /Issue/analyze` and nothing else. It has no
 *   `GET` of any kind left, and `POST /Issue/create` and `DELETE /Issue/{id}` were removed
 *   from it on 3 October (§0.1).
 * - `ISSUE_BASE`, IssueService on 5195, serves `GET /Farmer/issues/{reporterId}`, which is
 *   the only read the farmer has (§4.3).
 *
 * Every endpoint on both is `[Authorize]`, hence `authenticated: true` throughout.
 */

import { API_ENDPOINTS, apiClient, getTokenUserId } from '@/api';
import { API_BASE_URLS, UPLOAD_TIMEOUT_MS, USE_LOCAL_REPORT_MIRROR } from '@/config/env';
import type { PickedImage } from '@/types/image';

import {
  getMirroredReport,
  listMirroredReports,
  saveMirroredReport,
} from './reportStore';

import type {
  AiAnalysisResult,
  CreateIssueFields,
  GetFarmerIssuesWire,
  IssueStatusCode,
  Report,
  ReportStatus,
  ReportTrackerDetails,
} from '../types';

const BASE = API_BASE_URLS.report;
const ISSUE_BASE = API_BASE_URLS.issue;

/** A fallback filename only. ReportService validates no content types on upload. */
const PHOTO_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** The form field is `Photo`, capitalised: it binds to AnalyzeIssueRequest's property. */
export function buildAnalyzeFormData(photo: PickedImage): FormData {
  const formData = new FormData();
  const mimeType = photo.type || 'image/jpeg';
  const extension = PHOTO_EXTENSIONS[mimeType.toLowerCase()] || 'jpg';

  formData.append('Photo', {
    uri: photo.uri,
    type: mimeType,
    name: photo.fileName || `photo.${extension}`,
  } as unknown as Blob);

  return formData;
}

/** Anything with no `Z` and no offset, e.g. "2026-08-09T13:01:13.4206342". */
const NAIVE_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;

/** `datetime2` carries no offset, so JS reads a bare server timestamp as local time. */
export function toUtcTimestamp(timestamp: string): string {
  return NAIVE_TIMESTAMP.test(timestamp) ? `${timestamp}Z` : timestamp;
}

// ParseConfidence stores 0.91 for "0.91" but 91 for "91%", and the sender is unknown.
export function normalizeConfidence(confidence: number): number {
  if (!Number.isFinite(confidence) || confidence <= 0) {
    return 0;
  }
  return confidence > 1 ? Math.min(confidence / 100, 1) : confidence;
}

/**
 * `IssueStatus`, verbatim from §3. No JsonStringEnumConverter is registered anywhere in the
 * solution, so it crosses the wire as an int - and `GET /Farmer/issues` is the first caller
 * that actually sends one, which is how 2 and 3 were wrong here unnoticed.
 *
 * `Verified` is deliberately absent: nothing in the backend ever assigns it.
 */
const STATUS_BY_CODE: Record<IssueStatusCode, ReportStatus> = {
  0: 'Reported',
  1: 'Diagnosed',
  2: 'Assigned',
  3: 'Reviewed',
  4: 'Scheduled',
  5: 'Repaired',
  6: 'completed',
};

export function describeStatus(status: IssueStatusCode | ReportStatus): ReportStatus {
  if (typeof status === 'number') {
    // Falls back rather than throwing: the server can grow the enum before this file does.
    return STATUS_BY_CODE[status] ?? 'Reported';
  }
  return status;
}

// The MinIO bucket is also called `reportimage`, so the word appears twice in a direct URL.
const OBJECT_KEY_PREFIX = 'reportimage/';

/** Re-points the object key at MediaStorageService; the server's own URLs 403 and hardcode 127.0.0.1. */
export function resolveAttachmentUrl(url: string): string {
  const keyStart = url.lastIndexOf(OBJECT_KEY_PREFIX);
  if (keyStart === -1) {
    return url;
  }
  return `${API_BASE_URLS.media}${API_ENDPOINTS.storage.download(url.slice(keyStart))}`;
}

/** What IssueService stores when the model names no severity; GetPriority reads it as Unknown. */
const UNKNOWN_SEVERITY = 'غير معروفة';

// Nullable is on server-side, so every non-`?` string in AiAnalysisResponse is [Required] on create.
// The vision service's success body has no `problem_code`, so analyze hands back problemName: null
// and posting that back verbatim is a 400 VALIDATION_FAILED. Filled here, never invented elsewhere.
export function toCreatableAnalysis(analysis: AiAnalysisResult): AiAnalysisResult {
  return {
    ...analysis,
    problemName: analysis.problemName || analysis.problemArabic || 'Unknown',
    severity: analysis.severity || UNKNOWN_SEVERITY,
    recommendation: analysis.recommendation ?? '',
    repairSteps: analysis.repairSteps ?? [],
  };
}

/** Uploads the photo and runs the model. Slow, so it carries the upload timeout. */
export async function analyzeIssue(photo: PickedImage): Promise<AiAnalysisResult> {
  const analysis = await apiClient.post<AiAnalysisResult>(
    BASE,
    API_ENDPOINTS.report.analyze,
    buildAnalyzeFormData(photo),
    {
      authenticated: true,
      // Aborting an upload the server is still writing leaves an orphan photo in MinIO.
      timeoutMs: UPLOAD_TIMEOUT_MS,
    },
  );

  // Filled before the queue checkpoints it, so a retried create sends a body the server accepts.
  return toCreatableAnalysis({
    ...analysis,
    confidence: normalizeConfidence(analysis.confidence),
  });
}

/** Deliberately not guid-shaped, so `isServerIssueId` reads it as local and nothing asks the
 * map or the feed for a report only this device knows about. */
function createLocalReportId(): string {
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Files nothing. `POST /Issue/create` was deleted on 3 October and `POST /Issue/analyze` has
 * already uploaded the photo, run the model and enqueued the issue creation as a Hangfire job
 * (§0.1/§4.1) - so filing a report is one network call, and this is its local half.
 *
 * Creation is asynchronous and the response carries no id, so the row written here keeps a
 * local id of its own and is never reconciled with the server's: see `getReportById`.
 *
 * Every report is mirrored, not just the untracked ones. `getMyReports` is where the list is
 * narrowed - the diagnosis screen reads this row back by id immediately after filing, and for
 * a Medium+ report the server may not have created anything yet.
 */
export async function createIssue(fields: CreateIssueFields): Promise<Report> {
  const { analysis, description, latitude, longitude } = fields;
  const now = new Date().toISOString();
  const id = createLocalReportId();

  // The queue only drains with a usable session, so this is always set in practice. Empty
  // rather than invented otherwise - isReportOwner fails closed on it, same as a map row.
  const reporterId = (await getTokenUserId()) ?? '';

  const report: Report = {
    id,
    title: analysis.problemArabic || analysis.problemName,
    description,
    // Node 2, not node 1: factsFromWireStatus reads hasAiAnalysis off `status !== 'Reported'`,
    // and the farmer has just been shown the diagnosis, so it is true.
    status: 'Diagnosed',
    createdAt: now,
    reporterId,
    latitude,
    longitude,
    attachments: [
      { id: `${id}-photo`, type: 'Photo', url: analysis.filePath, createdAt: now },
    ],
    analysis: { ...analysis, modelVersion: '', createdAt: now },
  };

  if (USE_LOCAL_REPORT_MIRROR) {
    await saveMirroredReport(report);
  }

  return report;
}

/**
 * The six severities ReportService maps to Medium or above, and so the only six that cause an
 * issue to be created at all (§4.1). `منخفضة` - "low" - maps to **Medium**, not Low. That
 * reads backwards and it is not a mistake, so do not "fix" it.
 *
 * An allow-list rather than a list of the four minor severities, because ReportService's own
 * mapping ends in `_ => IssuePriority.Unknown`: a severity it does not recognise creates
 * nothing. Naming what *does* create therefore fails toward "the mirror lists it", which is
 * the direction that cannot duplicate a row.
 */
const BACKEND_CREATES_ISSUE_FOR: ReadonlySet<string> = new Set([
  'حرجة جداً',
  'حرجة',
  'عالية جداً',
  'عالية',
  'متوسطة',
  'منخفضة',
]);

/** True for a report the backend will never create, which is the only kind the list shows. */
function isUntrackedByBackend(report: Report): boolean {
  return !BACKEND_CREATES_ISSUE_FOR.has(report.analysis?.severity ?? '');
}

const NO_REPORTER_ID =
  'No user id in the access token, so GET /Farmer/issues has no ReporterId to send.';

/**
 * §4.3's row onto a `Report`. The scheduling fields - `sceduleDate`, `slotStart`, `slotEnd`,
 * `expertName`, `expertUrl`, `expertId`, `teamName` - are real data this deliberately drops,
 * because F-06 is still served by the mock; see REFERENCE-NOTES.md.
 */
// BACKEND-GAP: the row carries no priority and no attachments, so there is no severity to read
// and no photo to show. Neither is invented: `analysis` stays undefined and `attachments` empty.
export function fromFarmerIssue(row: GetFarmerIssuesWire): Report {
  return {
    id: row.issueId,
    title: row.title,
    description: row.description,
    status: describeStatus(row.status),
    // `datetime2` carries no offset, so this is the difference between today and yesterday.
    createdAt: toUtcTimestamp(row.createdAt),
    reporterId: row.reporterId,
    attachments: [],
  };
}

/** The guid goes in the path *and* the query string: `farmerIssues` spells it twice because
 * the service authorises against the query value and ignores the route segment (§4.3). */
async function fetchServerReports(): Promise<Report[]> {
  const reporterId = await getTokenUserId();
  if (!reporterId) {
    throw new Error(NO_REPORTER_ID);
  }

  const rows = await apiClient.get<GetFarmerIssuesWire[]>(
    ISSUE_BASE,
    API_ENDPOINTS.issue.farmerIssues(reporterId),
    { authenticated: true },
  );

  return rows.map(fromFarmerIssue);
}

/**
 * Newest first, from two sets that cannot intersect: the issues the backend created, and the
 * reports it declined to create. §4.1 maps a Low or Unknown severity and then creates nothing
 * at all, so those rows exist only in the mirror and no report can be in both halves. That is
 * what lets this concatenate with no matching and still never duplicate a row.
 *
 * THE INVARIANT, and it is the whole design: if the backend ever starts creating Low-severity
 * issues, the two sets overlap and this begins showing every such report twice. That is the
 * deletion condition for the mirror - see BACKEND-CONTRACT-REQUESTS.md.
 *
 * A failed server read is allowed to throw: بلاغاتي has an error state, and presenting half a
 * list as if it were the whole one would be the worse answer.
 */
export async function getMyReports(): Promise<Report[]> {
  const server = await fetchServerReports();
  const untracked = USE_LOCAL_REPORT_MIRROR
    ? (await listMirroredReports()).filter(isUntrackedByBackend)
    : [];

  return [...server, ...untracked].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

// BACKEND-GAP: there is no `GET /Farmer/issues/{issueId}`. The route that looks like one is the
// list, and it filters on the query string, so a single issue has no endpoint of its own.
/**
 * The mirror first: it is local, free, and for a report filed seconds ago it is the only place
 * the row exists at all. Only then the server's list. Unlike `getMyReports` this sees the whole
 * mirror, because the diagnosis screen reaches a just-filed report by the local id `createIssue`
 * returned, whatever its severity.
 *
 * So two ids can address one Medium-or-above report: the local one, which carries the AI
 * analysis and the photo, and the server guid, which carries neither, because GetFarmerIssues
 * returns no analysis and no attachments. They are not reconciled, and cannot be - creation is
 * asynchronous, no id comes back, and the payload has no photo URL to join on. The ask for both
 * fields is in BACKEND-CONTRACT-REQUESTS.md; the consequence is in REFERENCE-NOTES.md.
 */
export async function getReportById(reportId: string): Promise<Report> {
  const mirrored = USE_LOCAL_REPORT_MIRROR ? await getMirroredReport(reportId) : null;
  if (mirrored) {
    return mirrored;
  }

  const found = (await fetchServerReports()).find(report => report.id === reportId);
  if (!found) {
    throw new Error(`No report with id ${reportId}`);
  }

  return found;
}

const NO_DELETE_ENDPOINT = 'DELETE /Issue/{id} was removed on 3 Oct. See BACKEND-INTEGRATION-FACTS.md §0.1.';

/** Dead on the wire, same as createIssue above. */
export async function deleteReport(_reportId: string): Promise<void> {
  throw new Error(NO_DELETE_ENDPOINT);
}

const NO_TRACKER_ENDPOINT =
  'IssueController has no read endpoint for the tracker; see USE_MOCK_TRACKER in config/env.';

/** F-06. Nothing to swap to yet - BACKEND-CONTRACT-REQUESTS item 3 is still open. */
export async function getReportTracker(_reportId: string): Promise<ReportTrackerDetails> {
  throw new Error(NO_TRACKER_ENDPOINT);
}

const NO_TRACKER_WRITE =
  'IssueController has no write endpoint for a farmer confirmation or rejection yet.';

/** T7. */
export async function confirmResolution(_reportId: string): Promise<void> {
  throw new Error(NO_TRACKER_WRITE);
}

/** T8. */
export async function rejectResolution(_reportId: string): Promise<void> {
  throw new Error(NO_TRACKER_WRITE);
}
