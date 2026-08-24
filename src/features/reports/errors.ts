// Branch on kind, never message text: server copy is unstable and not always Arabic.

import { ApiError } from '@/api';

export type ReportErrorKind =
  /** Never reached the server: no connection, or it timed out. */
  | 'offline'
  /** Token missing, expired or rejected. */
  | 'unauthorized'
  /** The model looked at the photo and would not diagnose it. F-03c answers this. */
  | 'unrecognized'
  /** Reached the server and it refused, or something non-API threw. */
  | 'unknown';

export type ReportError = {
  kind: ReportErrorKind;
  /** Already Arabic and safe to show. */
  message: string;
};

const OFFLINE_MESSAGE = 'تحقق من اتصالك وحاول مرة أخرى';
const UNAUTHORIZED_MESSAGE = 'انتهت جلستك، سجّل الدخول مرة أخرى';

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

  // client.ts already pulled the server's own message out of the ASP.NET body.
  return { kind: 'unknown', message: error.message || fallback };
}

const UNRECOGNIZED_MESSAGE = 'لم نتمكن من رؤية مشكلة واضحة في الصورة';

// Sniffs the body because ReportService turns every vision refusal into an untyped 500.

// TODO: needs a typed 422 from ReportService; a published backend sends no body to match.
function isPhotoRefusal(error: ApiError): boolean {
  if (error.status !== 500 || typeof error.body !== 'string') {
    return false;
  }
  return error.body.includes('InvalidOperationException');
}

/** describeError, plus the one failure that has a screen of its own rather than a retry. */
export function describeAnalysisError(error: unknown, fallback: string): ReportError {
  if (error instanceof ApiError && isPhotoRefusal(error)) {
    return { kind: 'unrecognized', message: UNRECOGNIZED_MESSAGE };
  }
  return describeError(error, fallback);
}
