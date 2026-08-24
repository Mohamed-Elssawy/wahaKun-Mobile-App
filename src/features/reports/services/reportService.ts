/** Every ReportController endpoint is [Authorize], hence `authenticated: true` throughout. */

import { API_ENDPOINTS, apiClient } from '@/api';
import { API_BASE_URLS, UPLOAD_TIMEOUT_MS } from '@/config/env';

import type { CreatedReport, Report, CreateReportFields } from '../types';

const BASE = API_BASE_URLS.report;

/** A fallback filename only. ReportService validates no content types on upload. */
const PHOTO_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/** Backend field names verbatim, mixed casing included: `photo` but `Description`. */
export function buildCreateReportFormData(fields: CreateReportFields): FormData {
  const formData = new FormData();
  const mimeType = fields.photo.type || 'image/jpeg';
  const extension = PHOTO_EXTENSIONS[mimeType.toLowerCase()] || 'jpg';

  // ReportService re-derives the filename from the stored URL when it feeds the model.
  formData.append('photo', {
    uri: fields.photo.uri,
    type: mimeType,
    name: fields.photo.fileName || `photo.${extension}`,
  } as unknown as Blob);

  // 0 is a real coordinate, so the numbers need undefined checks, not truthiness.
  if (fields.description) {
    formData.append('Description', fields.description);
  }
  // Queued reports only. A retry with the same key gets the report the server already made.
  if (fields.idempotencyKey) {
    formData.append('IdempotencyKey', fields.idempotencyKey);
  }
  if (fields.latitude !== undefined) {
    formData.append('Latitude', String(fields.latitude));
  }
  if (fields.longitude !== undefined) {
    formData.append('Longitude', String(fields.longitude));
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

/** Every read below routes through here, so a Report means one thing everywhere. */
function normalizeReport(report: Report): Report {
  // Destructured, not spread: the server sends `analysis: null` where the type says undefined.
  const { analysis, ...rest } = report;

  const normalized: Report = {
    ...rest,
    createdAt: toUtcTimestamp(report.createdAt),
    attachments: report.attachments.map(attachment => ({
      ...attachment,
      url: resolveAttachmentUrl(attachment.url),
      createdAt: toUtcTimestamp(attachment.createdAt),
    })),
  };

  // Assigned, not spread: writing `updatedAt: undefined` over the server's null re-adds the key.
  if (report.updatedAt) {
    normalized.updatedAt = toUtcTimestamp(report.updatedAt);
  }

  if (!analysis) {
    return normalized;
  }
  return {
    ...normalized,
    analysis: {
      ...analysis,
      createdAt: toUtcTimestamp(analysis.createdAt),
      confidence: normalizeConfidence(analysis.confidence),
    },
  };
}

/** Returns as soon as the row exists. Analysis is a separate call, hence `CreatedReport`. */
export async function createReport(fields: CreateReportFields) {
  return apiClient.post<CreatedReport>(
    BASE,
    API_ENDPOINTS.report.create,
    buildCreateReportFormData(fields),
    {
      authenticated: true,
      // Aborting an upload the server is still writing is what produces duplicates.
      timeoutMs: UPLOAD_TIMEOUT_MS,
    },
  );
}

export async function analyzeReport(reportId: string) {
  const report = await apiClient.post<Report>(
    BASE,
    API_ENDPOINTS.report.analyze(reportId),
    undefined,
    {
      authenticated: true,
    },
  );
  return normalizeReport(report);
}

/** Newest first. Sorted client-side because GetMyReports answers in insertion order. */
export async function getMyReports() {
  const reports = await apiClient.get<Report[]>(BASE, API_ENDPOINTS.report.myReports, {
    authenticated: true,
  });
  return reports
    .map(normalizeReport)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function getReportById(reportId: string) {
  const report = await apiClient.get<Report>(BASE, API_ENDPOINTS.report.byId(reportId), {
    authenticated: true,
  });
  return normalizeReport(report);
}

export function deleteReport(reportId: string) {
  return apiClient.delete<void>(BASE, API_ENDPOINTS.report.delete(reportId), {
    authenticated: true,
  });
}
