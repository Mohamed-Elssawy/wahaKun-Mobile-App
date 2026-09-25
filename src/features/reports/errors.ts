// Branch on kind, never message text: server copy is unstable and not always Arabic.

import { ApiError } from '@/api';

export type ReportErrorKind =
  /** Never reached the server: no connection, or it timed out. */
  | 'offline'
  /** Token missing, expired or rejected. */
  | 'unauthorized'
  /** The model looked at the photo and would not diagnose it. F-03c answers this. */
  | 'unrecognized'
  /** Diagnosed fine, but ReportService refuses to file anything below Medium priority. */
  | 'tooMinor'
  /** Reached the server and it refused, or something non-API threw. */
  | 'unknown';

export type ReportError = {
  kind: ReportErrorKind;
  /** Already Arabic and safe to show. */
  message: string;
};

const OFFLINE_MESSAGE = 'تحقق من اتصالك وحاول مرة أخرى';
const UNAUTHORIZED_MESSAGE = 'انتهت جلستك، سجّل الدخول مرة أخرى';
const FORBIDDEN_MESSAGE = 'ليست لديك صلاحية لهذا الإجراء';

/** Each caller passes its own fallback, since loading and sending fail differently. */
export function describeError(error: unknown, fallback: string): ReportError {
  if (!(error instanceof ApiError)) {
    return { kind: 'unknown', message: fallback };
  }

  if (error.isNetworkError) {
    return { kind: 'offline', message: OFFLINE_MESSAGE };
  }

  if (error.isUnauthorized) {
    return { kind: 'unauthorized', message: UNAUTHORIZED_MESSAGE };
  }

  // Forbidden, not expired: re-login cannot fix it, so 'unknown' fails this item instead of pausing the queue.
  if (error.isForbidden) {
    return { kind: 'unknown', message: FORBIDDEN_MESSAGE };
  }

  // client.ts already pulled the server's own message out of the ASP.NET body.
  return { kind: 'unknown', message: error.message || fallback };
}

const UNRECOGNIZED_MESSAGE = 'لم نتمكن من رؤية مشكلة واضحة في الصورة';
const TOO_MINOR_MESSAGE = 'المشكلة تبدو بسيطة، ولا يحتاج هذا البلاغ إلى متابعة';

// Both refusals are untyped 500s, so the call that threw is the only thing telling them apart.

// TODO: needs a typed 4xx from ReportService; until then a 500 body is all there is to match.
function isRefusal(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status === 500 &&
    typeof error.body === 'string' &&
    error.body.includes('InvalidOperationException')
  );
}

/** For api/Issue/analyze, where a refusal means the model would not read the photo. */
export function describeAnalysisError(error: unknown, fallback: string): ReportError {
  if (isRefusal(error)) {
    return { kind: 'unrecognized', message: UNRECOGNIZED_MESSAGE };
  }
  return describeError(error, fallback);
}

/** For api/Issue/create, where the same shape means the priority was below Medium. */
export function describeCreateError(error: unknown, fallback: string): ReportError {
  if (isRefusal(error)) {
    return { kind: 'tooMinor', message: TOO_MINOR_MESSAGE };
  }
  return describeError(error, fallback);
}

const UNKNOWN_MESSAGE = 'تعذر إرسال البلاغ، حاول مرة أخرى';

/** Kind to Arabic copy, for a failed queue item the screen shows without a live error object. */
export const FAILURE_MESSAGES: Record<ReportErrorKind, string> = {
  offline: OFFLINE_MESSAGE,
  unauthorized: UNAUTHORIZED_MESSAGE,
  unrecognized: UNRECOGNIZED_MESSAGE,
  tooMinor: TOO_MINOR_MESSAGE,
  unknown: UNKNOWN_MESSAGE,
};
