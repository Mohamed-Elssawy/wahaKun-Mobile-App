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

import { getMirroredReport, listMirroredReports } from './reportStore';

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

const NO_CREATE_ENDPOINT =
  'POST /Issue/create was removed on 3 Oct; analyze now enqueues issue creation itself. ' +
  'See BACKEND-INTEGRATION-FACTS.md §0.1/§4.1 - S5b rebuilds this onto the one-call flow.';

/** Dead on the wire: kept only so the signature survives until S5b rebuilds this against
 * the one-call /Issue/analyze flow. */
export async function createIssue(_fields: CreateIssueFields): Promise<Report> {
  throw new Error(NO_CREATE_ENDPOINT);
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
 * Newest first, from both halves: the issues the backend created, plus the mirror's own rows.
 * A failed server read is allowed to throw - بلاغاتي has an error state and showing a
 * half-empty list as if it were the whole one would be the worse answer.
 */
export async function getMyReports(): Promise<Report[]> {
  const server = await fetchServerReports();
  const mirrored = USE_LOCAL_REPORT_MIRROR ? await listMirroredReports() : [];

  return [...server, ...mirrored].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

// BACKEND-GAP: there is no `GET /Farmer/issues/{issueId}`. The route that looks like one is the
// list, and it filters on the query string, so a single issue has no endpoint of its own.
/** The mirror first: it is local, free, and for a report filed seconds ago it is the only
 * place the row exists at all. Only then the server's list. */
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
