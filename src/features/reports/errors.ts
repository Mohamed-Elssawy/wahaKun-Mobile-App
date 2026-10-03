// Branch on kind / backend code, never on message text.

import { ApiError } from '@/api';
import { isDisplayableArabic } from '@/api/errorMessages';

export type ReportErrorKind =
  /** Never reached the server: no connection, or it timed out. Retried with backoff. */
  | 'offline'
  /** Reached the server, but it or a dependency (AI, MinIO, DB) is temporarily down. Retried with backoff. */
  | 'temporary'
  /** Token missing, expired or rejected, and refresh failed. */
  | 'unauthorized'
  /** The model looked at the photo and would not diagnose it. F-03c answers this. */
  | 'unrecognized'
  /** Diagnosed fine, but ReportService refuses to file anything below Medium priority. */
  | 'tooMinor'
  /** Reached the server and it refused for another reason, or something non-API threw. */
  | 'unknown';

export type ReportError = {
  kind: ReportErrorKind;
  /** Already Arabic and safe to show. */
  message: string;
  /** Backend code, kept for logs/debugging. */
  code?: string;
};

const OFFLINE_MESSAGE = 'تحقق من اتصالك وحاول مرة أخرى';
const TEMPORARY_MESSAGE = 'الخدمة مشغولة حالياً، سيُعاد إرسال البلاغ تلقائياً';
const UNAUTHORIZED_MESSAGE = 'انتهت جلستك، سجّل الدخول مرة أخرى';
const UNRECOGNIZED_MESSAGE = 'لم نتمكن من رؤية مشكلة واضحة في الصورة';
const TOO_MINOR_MESSAGE = 'المشكلة تبدو بسيطة، ولا يحتاج هذا البلاغ إلى متابعة';
const UNKNOWN_MESSAGE = 'تعذر إرسال البلاغ، حاول مرة أخرى';

/** Every PHOTO_* code from ReportService means "the model refused this photo". */
const PHOTO_REJECTION_CODES = new Set([
  'PHOTO_REJECTED',
  'PHOTO_POOR_QUALITY',
  'PHOTO_NOT_IRRIGATION',
  'PHOTO_LOW_CONFIDENCE',
  'PHOTO_UNCERTAIN',
]);

/** Each caller passes its own fallback, since loading and sending fail differently. */
export function describeError(error: unknown, fallback: string): ReportError {
  if (!(error instanceof ApiError)) {
    return { kind: 'unknown', message: fallback };
  }

  const base = { code: error.code, message: error.userMessage || fallback };

  if (error.isNetworkError) {
    return { ...base, kind: 'offline', message: OFFLINE_MESSAGE };
  }

  if (error.isUnauthorized) {
    return { ...base, kind: 'unauthorized', message: UNAUTHORIZED_MESSAGE };
  }

  if (error.code && PHOTO_REJECTION_CODES.has(error.code)) {
    return { ...base, kind: 'unrecognized' };
  }

  if (error.code === 'ISSUE_PRIORITY_TOO_LOW') {
    return { ...base, kind: 'tooMinor', message: TOO_MINOR_MESSAGE };
  }

  if (error.isTransient) {
    return { ...base, kind: 'temporary' };
  }

  // Forbidden, validation, not found…: re-sending the same request cannot fix these.
  return { ...base, kind: 'unknown' };
}

/** IssueService throws InvalidOperationException for both business refusals, which the middleware sends as this. */
const INVALID_OPERATION = 'INVALID_OPERATION';

/** The server's own Arabic reason when it sent one, e.g. the vision service's "الصورة لا تظهر مشكلة ري واضحة." */
function serverReason(error: ApiError, fallback: string): string {
  const reason = error.details.serverMessage;
  return isDisplayableArabic(reason) ? reason : fallback;
}

/** For api/Issue/analyze. INVALID_OPERATION here means the model refused the photo (refused, low_confidence, poor_quality, uncertain). */
export function describeAnalysisError(error: unknown, fallback: string): ReportError {
  if (error instanceof ApiError && error.code === INVALID_OPERATION) {
    return {
      kind: 'unrecognized',
      code: error.code,
      message: serverReason(error, UNRECOGNIZED_MESSAGE),
    };
  }
  return describeError(error, fallback || UNKNOWN_MESSAGE);
}

/** For api/Issue/create. INVALID_OPERATION here means GetPriority returned Low/Unknown and the photo was deleted. */
export function describeCreateError(error: unknown, fallback: string): ReportError {
  if (error instanceof ApiError && error.code === INVALID_OPERATION) {
    return { kind: 'tooMinor', code: error.code, message: TOO_MINOR_MESSAGE };
  }
  return describeError(error, fallback || UNKNOWN_MESSAGE);
}

/** Kind to Arabic copy, for a failed queue item stored without its original message. */
export const FAILURE_MESSAGES: Record<ReportErrorKind, string> = {
  offline: OFFLINE_MESSAGE,
  temporary: TEMPORARY_MESSAGE,
  unauthorized: UNAUTHORIZED_MESSAGE,
  unrecognized: UNRECOGNIZED_MESSAGE,
  tooMinor: TOO_MINOR_MESSAGE,
  unknown: UNKNOWN_MESSAGE,
};
