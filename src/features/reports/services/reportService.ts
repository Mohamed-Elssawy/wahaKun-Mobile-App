/** Every IssueController endpoint is [Authorize], hence `authenticated: true` throughout. */

// analyze uploads the photo and runs the model; create then files it. Nothing exists until create.

import { API_ENDPOINTS, apiClient } from '@/api';
import { API_BASE_URLS, UPLOAD_TIMEOUT_MS, USE_LOCAL_REPORT_MIRROR } from '@/config/env';
import type { PickedImage } from '@/types/image';

import { emitIssueChange } from './issueEvents';
import {
  getMirroredReport,
  listMirroredReports,
  removeMirroredReport,
  saveMirroredReport,
} from './reportStore';

import type {
  AiAnalysisResult,
  CreatedIssue,
  CreateIssueFields,
  IssueStatusCode,
  Report,
  ReportStatus,
  ReportTrackerDetails,
} from '../types';

const BASE = API_BASE_URLS.report;

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

/** No JsonStringEnumConverter is registered, so IssueStatus crosses the wire as an int. */
const STATUS_BY_CODE: Record<IssueStatusCode, ReportStatus> = {
  0: 'Reported',
  1: 'Diagnosed',
  2: 'Verified',
  3: 'Assigned',
  4: 'Scheduled',
  5: 'Repaired',
  6: 'Completed',
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

/** Files the issue and returns a whole Report: create's own response carries neither photo nor analysis. */
export async function createIssue(fields: CreateIssueFields): Promise<Report> {
  const { description, latitude, longitude } = fields;
  // Again here: a queue item checkpointed by an older build still holds problemName: null.
  const analysis = toCreatableAnalysis(fields.analysis);

  const created = await apiClient.post<CreatedIssue>(
    BASE,
    API_ENDPOINTS.report.create,
    {
      // Sent back whole; create reads FilePath and Severity straight off it.
      aiAnalysisResponse: analysis,
      // 0 is a real coordinate, so these need undefined checks rather than truthiness.
      latitude: latitude === undefined ? undefined : String(latitude),
      longitude: longitude === undefined ? undefined : String(longitude),
    },
    { authenticated: true },
  );

  const createdAt = toUtcTimestamp(created.createdAt);

  const report: Report = {
    id: created.id,
    // Server-side these come off the analysis too, so the farmer's own description is dropped.
    title: analysis.problemArabic || analysis.problemName,
    description: created.description ?? description,
    status: describeStatus(created.status),
    createdAt,
    reporterId: created.reporterId,
    latitude,
    longitude,
    attachments: [
      {
        id: `${created.id}-photo`,
        type: 'Photo',
        url: resolveAttachmentUrl(analysis.filePath),
        createdAt,
      },
    ],
    analysis: { ...analysis, modelVersion: '', createdAt },
  };

  // Assigned, not spread: writing `updatedAt: undefined` over the server's null re-adds the key.
  if (created.updatedAt) {
    report.updatedAt = toUtcTimestamp(created.updatedAt);
  }

  await saveMirroredReport(report);
  emitIssueChange({ kind: 'created', issueId: report.id });

  return report;
}

const NO_READ_ENDPOINT =
  'IssueController exposes no read endpoint; see USE_LOCAL_REPORT_MIRROR in config/env.';

/** Newest first. Local while the mirror is on, since GetMyIssues is commented out server-side. */
export async function getMyReports(): Promise<Report[]> {
  if (!USE_LOCAL_REPORT_MIRROR) {
    throw new Error(NO_READ_ENDPOINT);
  }
  return listMirroredReports();
}

export async function getReportById(reportId: string): Promise<Report> {
  if (!USE_LOCAL_REPORT_MIRROR) {
    throw new Error(NO_READ_ENDPOINT);
  }

  const report = await getMirroredReport(reportId);
  if (!report) {
    throw new Error(`No mirrored report for ${reportId}`);
  }
  return report;
}

export async function deleteReport(reportId: string): Promise<void> {
  await apiClient.delete<void>(BASE, API_ENDPOINTS.report.delete(reportId), {
    authenticated: true,
  });
  await removeMirroredReport(reportId);
  emitIssueChange({ kind: 'deleted', issueId: reportId });
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
