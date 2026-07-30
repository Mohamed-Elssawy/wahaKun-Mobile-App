/** Every ReportController endpoint is [Authorize], hence `authenticated: true` throughout. */

import { API_ENDPOINTS, apiClient } from '@/api';
import { API_BASE_URLS } from '@/config/env';

import type { Report, CreateReportFields } from '../types';

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
  if (fields.latitude !== undefined) {
    formData.append('Latitude', String(fields.latitude));
  }
  if (fields.longitude !== undefined) {
    formData.append('Longitude', String(fields.longitude));
  }

  return formData;
}

// ParseConfidence stores 0.91 for "0.91" but 91 for "91%", and the sender is unknown.
export function normalizeConfidence(confidence: number): number {
  if (!Number.isFinite(confidence) || confidence <= 0) {
    return 0;
  }
  return confidence > 1 ? Math.min(confidence / 100, 1) : confidence;
}

/** Every call below routes through here, so confidence means one thing everywhere. */
function normalizeReport(report: Report): Report {
  if (!report.analysis) {
    return report;
  }
  return {
    ...report,
    analysis: {
      ...report.analysis,
      confidence: normalizeConfidence(report.analysis.confidence),
    },
  };
}

/** Create also analyses, so it is slow and a failed analysis orphans a committed row. */
export async function createReport(fields: CreateReportFields) {
  const report = await apiClient.post<Report>(
    BASE,
    API_ENDPOINTS.report.create,
    buildCreateReportFormData(fields),
    {
      authenticated: true,
    },
  );
  return normalizeReport(report);
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

/** Newest first. Backs the My Issues screen. */
export async function getMyReports() {
  const reports = await apiClient.get<Report[]>(BASE, API_ENDPOINTS.report.myReports, {
    authenticated: true,
  });
  return reports.map(normalizeReport);
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
