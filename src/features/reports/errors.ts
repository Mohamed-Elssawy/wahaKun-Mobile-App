// Branch on kind / backend code, never on message text.

import { ApiError } from '@/api';
import { isDisplayable, isShowableText } from '@/api/errorMessages';
import { t } from '@/i18n';
import type { TranslationKey } from '@/i18n';

export type ReportErrorKind =
  /** Never reached the server: no connection, or it timed out. Retried with backoff. */
  | 'offline'
  /** Reached the server, but it or a dependency is temporarily down. Retried with backoff. */
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
  /** Resolved and safe to show, in the locale that was active where it was built. */
  message: string;
  /**
   * The server's own reason, raw and undecided.
   *
   * Whether it is fit to show is a question about the ACTIVE locale, so it is answered at the
   * read - never here, and never before it is written to the queue index.
   */
  serverMessage?: string;
  /** Backend code, kept for logs/debugging. */
  code?: string;
};

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

  // serverMessage rides alongside `message` rather than inside it: resolveUserMessage may
  // already have folded it in, and only the raw value can be judged again later, or stored.
  const base = {
    code: error.code,
    message: error.userMessage || fallback,
    serverMessage: storableReason(error),
  };

  if (error.isNetworkError) {
    return { ...base, kind: 'offline', message: t('errors.network.checkConnection') };
  }

  if (error.isUnauthorized) {
    return { ...base, kind: 'unauthorized', message: t('errors.api.sessionEnded') };
  }

  if (error.code && PHOTO_REJECTION_CODES.has(error.code)) {
    return { ...base, kind: 'unrecognized' };
  }

  if (error.code === 'ISSUE_PRIORITY_TOO_LOW') {
    return { ...base, kind: 'tooMinor', message: t('errors.report.tooMinor') };
  }

  if (error.isTransient) {
    return { ...base, kind: 'temporary' };
  }

  // Forbidden, validation, not found…: re-sending the same request cannot fix these.
  return { ...base, kind: 'unknown' };
}

/** ReportService's code only; IssueService answers guard refusals with an empty 500. */
const INVALID_OPERATION = 'INVALID_OPERATION';

/** The server's reason if it is worth keeping at all. Locale-free, so this can be stored. */
function storableReason(error: ApiError): string | undefined {
  const reason = error.details.serverMessage;
  return isShowableText(reason) ? reason : undefined;
}

/**
 * The server's own reason, when it reads in the locale the UI is rendering in.
 *
 * Undefined means there is nothing of theirs worth showing, which is a question for the READ
 * and not for the throw: a queued failure is stored and shown later, maybe in the other locale.
 */
export function serverReason(serverMessage: string | undefined): string | undefined {
  return isDisplayable(serverMessage) ? serverMessage : undefined;
}

/** For /Issue/analyze: INVALID_OPERATION here means the model refused the photo. */
export function describeAnalysisError(error: unknown, fallback: string): ReportError {
  if (error instanceof ApiError && error.code === INVALID_OPERATION) {
    const reason = storableReason(error);

    return {
      kind: 'unrecognized',
      code: error.code,
      message: serverReason(reason) ?? t('errors.report.unreadable'),
      serverMessage: reason,
    };
  }
  return describeError(error, fallback || t('errors.report.sendFailed'));
}

/** For /Issue/create: INVALID_OPERATION here means GetPriority returned Low or Unknown. */
export function describeCreateError(error: unknown, fallback: string): ReportError {
  if (error instanceof ApiError && error.code === INVALID_OPERATION) {
    // Deliberately no serverMessage: this refusal's text is developer prose about GetPriority,
    // and the copy below is what a farmer should read, in either language.
    return { kind: 'tooMinor', code: error.code, message: t('errors.report.tooMinor') };
  }
  return describeError(error, fallback || t('errors.report.sendFailed'));
}

/**
 * Kind to this app's own copy, held as keys and read only through failureMessage below. A
 * module-scope t() would freeze the locale at module init, which §16.2 puts before it is
 * resolved from storage.
 */
const FAILURE_KEYS: Record<ReportErrorKind, TranslationKey> = {
  offline: 'errors.network.checkConnection',
  temporary: 'errors.report.serviceBusy',
  unauthorized: 'errors.api.sessionEnded',
  unrecognized: 'errors.report.unreadable',
  tooMinor: 'errors.report.tooMinor',
  unknown: 'errors.report.sendFailed',
};

/**
 * What a stored failure reads as, resolved where it is READ.
 *
 * The queue used to persist the resolved sentence, so a report that failed in Arabic carried
 * Arabic copy in wk.queue.index for as long as it sat there - and once E5 keys this file, it
 * would carry whichever locale the farmer happened to be in when it failed. The kind is the
 * identity, the copy is a lookup, and the server's own reason wins only while it is readable
 * here and now.
 */
export function failureMessage(kind: ReportErrorKind, serverMessage?: string): string {
  return serverReason(serverMessage) ?? t(FAILURE_KEYS[kind]);
}
