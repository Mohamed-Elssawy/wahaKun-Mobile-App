/** One farmer surface over two services: ReportService serves analyze, IssueService the read. */

import { API_ENDPOINTS, apiClient, getTokenUserId } from '@/api';
import { API_BASE_URLS, UPLOAD_TIMEOUT_MS, USE_LOCAL_REPORT_MIRROR } from '@/config/env';
import type { PickedImage } from '@/types/image';

import { factsFromWireStatus } from '../lifecycle';
import { severityFromPriority } from '../severity';
import {
  getMirroredReport,
  listMirroredReports,
  loadLocalPhotos,
  rememberLocalPhoto,
  saveMirroredReport,
} from './reportStore';

import type {
  AiAnalysisResult,
  CreateIssueFields,
  FarmerIssuesPageWire,
  GetFarmerIssuesWire,
  IssueTrackingWire,
  IssueStatusCode,
  Report,
  ReportLocation,
  ReportStatus,
  ReportTrackerDetails,
  TrackerRepair,
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

/** The coordinate goes as strings because GPSLocation stores strings, and is omitted if absent. */
export function buildAnalyzeFormData(
  photo: PickedImage,
  location?: ReportLocation,
): FormData {
  const formData = new FormData();
  const mimeType = photo.type || 'image/jpeg';
  const extension = PHOTO_EXTENSIONS[mimeType.toLowerCase()] || 'jpg';

  formData.append('Photo', {
    uri: photo.uri,
    type: mimeType,
    name: photo.fileName || `photo.${extension}`,
  } as unknown as Blob);

  if (location) {
    formData.append('Latitude', String(location.latitude));
    formData.append('Longitude', String(location.longitude));
  }

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

/** IssueStatus from §3. The integer table stays because the deployment has reverted before. */
const STATUS_BY_CODE: Record<IssueStatusCode, ReportStatus> = {
  0: 'Reported',
  1: 'Diagnosed',
  2: 'Assigned',
  3: 'Reviewed',
  4: 'Scheduled',
  5: 'Repaired',
  6: 'completed',
};

/** What an unrecognised status reads as. Exported so a test can assert it, not infer it. */
export const STATUS_FALLBACK: ReportStatus = 'Reported';

/** Derived from the integer table so the two cannot drift, plus the unassigned Verified. */
const KNOWN_STATUS_NAMES: ReadonlySet<string> = new Set<ReportStatus>([
  ...Object.values(STATUS_BY_CODE),
  'Verified',
]);

/** Total over both vocabularies: an unknown value falls back rather than taking out the screen. */
export function describeStatus(status: IssueStatusCode | ReportStatus): ReportStatus {
  if (typeof status === 'number') {
    return STATUS_BY_CODE[status] ?? STATUS_FALLBACK;
  }
  // A name the table does not know - a status the server grew after this build - lands here.
  return KNOWN_STATUS_NAMES.has(status) ? status : STATUS_FALLBACK;
}

// The MinIO bucket is also called `reportimage`, so the word appears twice in a direct URL.
const OBJECT_KEY_PREFIX = 'reportimage/';

/** A scheme (`http:`, `file:`) or a leading slash: something to load as it is, not an object key. */
const NOT_A_KEY = /^([a-z][a-z0-9+.-]*:|\/)/i;

/** True for a value that loads as it is: a file:// uri survives, an object key does not. */
export function isLoadableUri(value: string): boolean {
  return NOT_A_KEY.test(value);
}

/** The contract: an attachment whose bytes cannot be fetched is reported absent, not present. */
export const STORAGE_SERVES_BYTES = true;

/** Anchored on a host segment, since a key may itself begin reportimage/ when so foldered. */
const BUCKET_URL_PREFIX = new RegExp(
  `^(?:[a-z][a-z0-9+.-]*://)?[^/]+/${OBJECT_KEY_PREFIX}`,
  'i',
);

/** Re-points the key at MediaStorageService, which takes the bare key Media.Grpc returns. */
export function resolveAttachmentUrl(url: string): string {
  const key = url.replace(BUCKET_URL_PREFIX, '');
  if (key !== url) {
    return `${API_BASE_URLS.media}${API_ENDPOINTS.storage.download(key)}`;
  }
  if (url && !NOT_A_KEY.test(url)) {
    return `${API_BASE_URLS.media}${API_ENDPOINTS.storage.download(url)}`;
  }
  return url;
}

/** Object key to local file:// uri, refreshed per read so a fresh report resolves at once. */
let localPhotos: Record<string, string> = {};

// Exported for the avatar, whose resolver is synchronous too and needs the index refreshed first.
export async function refreshLocalPhotos(): Promise<void> {
  localPhotos = USE_LOCAL_REPORT_MIRROR ? await loadLocalPhotos() : {};
}

/** This device's own file first, then storage once it serves bytes: the only copy that exists. */
export function photoUriForKey(key: string): string | null {
  return localPhotoUri(key) ?? (STORAGE_SERVES_BYTES ? resolveAttachmentUrl(key) : null);
}

/** The index alone, with no storage fallback: the avatar supplies its own URL builder. */
export function localPhotoUri(key: string): string | null {
  return localPhotos[key] ?? null;
}

/** Total on purpose: a drifted response or a failed thumbnail write must not fail the upload. */
export async function rememberUploadedPhoto(key: string, uri: string): Promise<void> {
  if (
    !USE_LOCAL_REPORT_MIRROR ||
    !OBJECT_KEY_SHAPE.test(key ?? '') ||
    !isLoadableUri(uri)
  ) {
    return;
  }

  try {
    await rememberLocalPhoto(key, uri);
  } catch {
    // Nothing to recover: the next read simply finds no local copy for this key.
  }

  await refreshLocalPhotos();
}

/** What IssueService stores when the model names no severity; GetPriority reads it as Unknown. */
const UNKNOWN_SEVERITY = 'غير معروفة';

// The vision service sends no problem_code, and posting null back is a 400. Filled here only.
export function toCreatableAnalysis(analysis: AiAnalysisResult): AiAnalysisResult {
  return {
    ...analysis,
    problemName: analysis.problemName || analysis.problemArabic || 'Unknown',
    severity: analysis.severity || UNKNOWN_SEVERITY,
    recommendation: analysis.recommendation ?? '',
    repairSteps: analysis.repairSteps ?? [],
  };
}

/** Matched at a line start, so a label occurring mid-sentence cannot truncate the text. */
const MODEL_SECTIONS = /\n\s*(Explanation|Steps|Severity Factors)\s*:/;

/** The first paragraph only, and total over a nullish value so one bad row cannot throw. */
export function stripModelSections(text: string | null | undefined): string {
  const [body] = (text ?? '').split(MODEL_SECTIONS);
  return body.trim();
}

/** Uploads the photo and runs the model. Slow, so it carries the upload timeout. */
export async function analyzeIssue(
  photo: PickedImage,
  location?: ReportLocation,
): Promise<AiAnalysisResult> {
  const analysis = await apiClient.post<AiAnalysisResult>(
    BASE,
    API_ENDPOINTS.report.analyze,
    buildAnalyzeFormData(photo, location),
    {
      authenticated: true,
      // Aborting an upload the server is still writing leaves an orphan photo in MinIO.
      timeoutMs: UPLOAD_TIMEOUT_MS,
    },
  );

  // The one moment both halves exist: the server's key, and the file still on this device.
  await rememberUploadedPhoto(analysis.filePath, photo.uri);

  // Filled before the queue checkpoints it, so a retried create sends a body the server accepts.
  return toCreatableAnalysis({
    ...analysis,
    confidence: normalizeConfidence(analysis.confidence),
    recommendation: stripModelSections(analysis.recommendation),
    // Left undefined when the model sent none, so the card stays hidden rather than drawing empty.
    explanation: analysis.explanation
      ? stripModelSections(analysis.explanation)
      : analysis.explanation,
  });
}

/** Deliberately not guid-shaped, so isServerIssueId reads it as local. */
function createLocalReportId(): string {
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Files nothing: analyze already enqueued creation, so this is only the local mirror half. */
export async function createIssue(fields: CreateIssueFields): Promise<Report> {
  const { analysis, description, latitude, longitude } = fields;
  const now = new Date().toISOString();
  const id = createLocalReportId();

  // Empty rather than invented: isReportOwner fails closed on it, the same as a map row.
  const reporterId = (await getTokenUserId()) ?? '';

  // The local file is the one copy that renders; an object key loads nowhere.
  await refreshLocalPhotos();
  const photoUri = analysis.filePath ? photoUriForKey(analysis.filePath) : null;

  const report: Report = {
    id,
    title: analysis.problemArabic || analysis.problemName,
    description,
    // Node 2, not node 1: hasAiAnalysis reads off status !== Reported, and the diagnosis is shown.
    status: 'Diagnosed',
    createdAt: now,
    reporterId,
    latitude,
    longitude,
    attachments: photoUri
      ? [{ id: `${id}-photo`, type: 'Photo', url: photoUri, createdAt: now }]
      : [],
    analysis: { ...analysis, modelVersion: '', createdAt: now },
  };

  if (USE_LOCAL_REPORT_MIRROR) {
    await saveMirroredReport(report);
  }

  return report;
}

/** An allow-list, because an unrecognised severity creates nothing: منخفضة maps to Medium. */
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

/** A MinIO object key: a folder segment, a name, an extension. Nothing else is loadable. */
const OBJECT_KEY_SHAPE = /^[\w.-]+\/[\w.-]+\.[a-z0-9]{2,5}$/i;

/** Three spellings, newest first, and anything not key-shaped is no photo at all. */
export function farmerIssuePhotoKey(row: GetFarmerIssuesWire): string | null {
  const key = row.imageurl ?? row.imagegurl ?? row.imageUrl;
  return typeof key === 'string' && OBJECT_KEY_SHAPE.test(key) ? key : null;
}

/** The row onto a Report. priority, latiude and longitude are deliberately unmapped. */
export function fromFarmerIssue(row: GetFarmerIssuesWire): Report {
  const createdAt = toUtcTimestamp(row.createdAt);
  // photoUriForKey owns the gate: a key is loadable only when a local file sits behind it.
  const photoKey = farmerIssuePhotoKey(row);
  const photoUri = photoKey ? photoUriForKey(photoKey) : null;

  return {
    id: row.issueId,
    title: row.title,
    // IssueService writes the model's `explanation` here, section dump and all - see above.
    description: stripModelSections(row.description),
    // The coarse axis, and the only severity this row has: no analysis comes with it.
    severity: severityFromPriority(row.priority),
    status: describeStatus(row.status),
    // `datetime2` carries no offset, so this is the difference between today and yesterday.
    createdAt,
    reporterId: row.reporterId,
    attachments: photoUri
      ? [
          {
            id: `${row.issueId}-photo`,
            type: 'Photo',
            url: photoUri,
            createdAt,
          },
        ]
      : [],
  };
}

const NOT_A_FARMER_ISSUES_BODY =
  'GET /Farmer/issues/{reporterId} answered with neither an array nor a results envelope.';

/** Both shapes are read: the envelope when it is there, the array when it is not. */
export function farmerIssueRows(body: unknown): GetFarmerIssuesWire[] {
  if (Array.isArray(body)) {
    return body as GetFarmerIssuesWire[];
  }

  const results = (body as FarmerIssuesPageWire | null)?.results;
  if (Array.isArray(results)) {
    return results;
  }

  throw new Error(NOT_A_FARMER_ISSUES_BODY);
}

/** The segment must be present for the route to match, though the server reads the token. */
async function fetchServerReports(): Promise<Report[]> {
  const reporterId = await getTokenUserId();
  if (!reporterId) {
    throw new Error(NO_REPORTER_ID);
  }

  const body = await apiClient.get<unknown>(
    ISSUE_BASE,
    API_ENDPOINTS.issue.farmerIssues(reporterId),
    { authenticated: true },
  );

  // Before the mapper, not inside it: `fromFarmerIssue` is synchronous and shared with the tests.
  await refreshLocalPhotos();

  return farmerIssueRows(body).map(fromFarmerIssue);
}

/** Two sets that cannot intersect: if the backend starts creating Low issues, this duplicates. */
export async function getMyReports(): Promise<Report[]> {
  const server = await fetchServerReports();
  const untracked = USE_LOCAL_REPORT_MIRROR
    ? (await listMirroredReports()).filter(isUntrackedByBackend)
    : [];

  return [...server, ...untracked].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

/** No GET for one issue exists, so the mirror answers first, and holds every fresh report. */
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

const NO_DELETE_ENDPOINT =
  'DELETE /Issue/{id} was removed on 3 Oct. See BACKEND-INTEGRATION-FACTS.md §0.1.';

/** Dead on the wire, same as createIssue above. */
export async function deleteReport(_reportId: string): Promise<void> {
  throw new Error(NO_DELETE_ENDPOINT);
}

const SERVER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ranked, not compared raw, so the ordering works when the server sends a name (D4). */
const STATUS_RANK: Record<ReportStatus, number> = {
  Reported: 0,
  Diagnosed: 1,
  Assigned: 2,
  Reviewed: 3,
  Scheduled: 4,
  Repaired: 5,
  completed: 6,
  // Ranked with Diagnosed, so an unexpected arrival cannot read as reviewed.
  Verified: 1,
};

/** completed is lowercase in the C# source, so the two casings are not a typo. */
function isWireStatus(
  status: IssueStatusCode | ReportStatus,
  name: ReportStatus,
): boolean {
  return describeStatus(status) === name;
}

/** F-06's status history: no specialty, window or notes, so those stay undefined. */
export function fromTracking(wire: IssueTrackingWire): ReportTrackerDetails {
  const status = describeStatus(wire.currentStatus);
  const step = (name: ReportStatus) => wire.steps.find(s => isWireStatus(s.status, name));
  const at = (name: ReportStatus) => {
    const changedAt = step(name)?.changedAt;
    return changedAt ? toUtcTimestamp(changedAt) : undefined;
  };

  const assigned = step('Assigned');
  const repaired = step('Repaired');
  const details: ReportTrackerDetails = {
    reportId: wire.issueId,
    status,
    // Reviewed and everything after it: the expert has submitted a review.
    hasExpertReview: STATUS_RANK[status] >= STATUS_RANK.Reviewed,
  };

  if (assigned?.expertName) {
    // No specialty field exists, and N1 confirms the name is the expert's phone number today.
    details.expert = { name: assigned.expertName, specialty: '' };
  }
  const assignedAt = at('Assigned');
  if (assignedAt) {
    details.assignedAt = assignedAt;
  }
  const reviewedAt = at('Reviewed');
  if (reviewedAt) {
    details.reviewedAt = reviewedAt;
  }

  // D6: a repair is a fact about the status, read through the same derivation as the list row.
  if (factsFromWireStatus(status).hasRepairConfirmation) {
    const repair: TrackerRepair = { notes: '' };
    // D5: the old fallback to now showed the farmer a time that changed on every reopen.
    const confirmedAt = at('Repaired');
    if (confirmedAt) {
      repair.confirmedAt = confirmedAt;
    }
    // W1: the key existing means nothing while storage cannot serve bytes; node 5 omits the chip.
    if (repaired?.repairPhoto && STORAGE_SERVES_BYTES) {
      repair.photoUrl = resolveAttachmentUrl(repaired.repairPhoto);
    }
    details.repair = repair;
  }

  const completedAt = at('completed');
  if (isWireStatus(wire.currentStatus, 'completed')) {
    details.closedBy = 'farmer';
    if (completedAt) {
      details.closedAt = completedAt;
    }
  }

  return details;
}

/** A report only this device knows about has no server tracker, so the mirror answers instead. */
export async function getReportTracker(reportId: string): Promise<ReportTrackerDetails> {
  if (!SERVER_ID.test(reportId)) {
    const mirrored = USE_LOCAL_REPORT_MIRROR ? await getMirroredReport(reportId) : null;
    if (!mirrored) {
      throw new Error(`No report with id ${reportId}`);
    }
    return { reportId, status: mirrored.status };
  }

  const wire = await apiClient.get<IssueTrackingWire>(
    ISSUE_BASE,
    API_ENDPOINTS.issue.tracking(reportId),
    { authenticated: true },
  );

  return fromTracking(wire);
}

/** T7. The response is ignored: the only state this trusts is the next read. */
export async function confirmResolution(reportId: string): Promise<void> {
  await apiClient.post(ISSUE_BASE, API_ENDPOINTS.issue.complete(reportId), undefined, {
    authenticated: true,
  });
}

/** T8. Returns a Repaired issue to Scheduled, deleting its Repaired and completed rows. */
export async function rejectResolution(reportId: string): Promise<void> {
  await apiClient.post(ISSUE_BASE, API_ENDPOINTS.issue.uncomplete(reportId), undefined, {
    authenticated: true,
  });
}
