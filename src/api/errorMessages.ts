import { detectDirection, direction, t } from '@/i18n';
import type { TranslationKey } from '@/i18n';

export type ApiErrorKind =
  | 'network'
  | 'timeout'
  | 'badRequest'
  | 'validation'
  | 'unauthorized'
  | 'forbidden'
  | 'notFound'
  | 'conflict'
  | 'rateLimited'
  | 'server'
  | 'badGateway'
  | 'unavailable'
  | 'unknown';

/** Keys, not messages: a module-scope t() would resolve before §16.2 loads the locale, freezing it. */
export const CODE_KEYS: Record<string, TranslationKey> = {
  VALIDATION_FAILED: 'errors.api.validation',
  BAD_REQUEST: 'errors.api.badRequest',
  INVALID_OPERATION: 'errors.api.actionUnavailable',
  NOT_FOUND: 'errors.api.notFound',
  CONFLICT: 'errors.api.alreadyExists',
  SERVER_ERROR: 'errors.api.server',
  DATABASE_ERROR: 'errors.api.database',
  DEPENDENCY_UNAVAILABLE: 'errors.api.serviceDown',
  REQUEST_CANCELLED: 'errors.api.cancelled',
  UNAUTHORIZED: 'errors.api.sessionEnded',
  TOKEN_MISSING: 'errors.api.loginRequired',
  TOKEN_EXPIRED: 'errors.api.sessionEnded',
  TOKEN_INVALID: 'errors.api.sessionInvalid',
  FORBIDDEN: 'errors.api.forbidden',
  INVALID_CREDENTIALS: 'errors.auth.badCredentials',
  ACCOUNT_NOT_APPROVED: 'errors.auth.pendingApproval',
  ACCOUNT_BLOCKED: 'errors.auth.suspended',
  USER_NOT_FOUND: 'errors.auth.noAccount',
  USER_ALREADY_EXISTS: 'errors.auth.accountExists',
  REGISTRATION_FAILED: 'errors.auth.signupFailed',
  INVALID_REFRESH_TOKEN: 'errors.api.sessionEnded',
  PASSWORD_RESET_FAILED: 'errors.auth.resetFailed',
  FIREBASE_TOKEN_INVALID: 'errors.auth.phoneVerifyFailed',
  UNSUPPORTED_FILE_TYPE: 'errors.media.unsupportedTypeDetail',
  PHOTO_REQUIRED: 'errors.report.photoRequired',
  PHOTO_REJECTED: 'errors.report.unreadable',
  PHOTO_POOR_QUALITY: 'errors.report.photoUnclear',
  PHOTO_NOT_IRRIGATION: 'errors.report.notIrrigation',
  PHOTO_LOW_CONFIDENCE: 'errors.report.lowConfidence',
  PHOTO_UNCERTAIN: 'errors.report.tooFar',
  ISSUE_PRIORITY_TOO_LOW: 'errors.report.tooMinor',
  ISSUE_NOT_FOUND: 'errors.report.missing',
  AI_SERVICE_UNAVAILABLE: 'errors.report.diagnosisDown',
  AI_SERVICE_ERROR: 'errors.report.analyseFailed',
  STORAGE_SERVICE_UNAVAILABLE: 'errors.report.uploadFailed',
  MAP_ISSUE_NOT_FOUND: 'errors.map.reportMissing',
  COMMENT_REJECTED: 'errors.community.commentBlocked',
};

export const STATUS_KEYS: Record<number, TranslationKey> = {
  400: 'errors.api.badRequestDetail',
  401: 'errors.api.sessionEnded',
  403: 'errors.api.forbidden',
  404: 'errors.api.serviceNotFound',
  405: 'errors.api.unsupportedAction',
  408: 'errors.api.timeout',
  409: 'errors.api.conflict',
  413: 'errors.media.tooLarge',
  415: 'errors.media.unsupportedType',
  422: 'errors.api.unprocessable',
  429: 'errors.auth.tooManyAttempts',
  500: 'errors.api.server',
  502: 'errors.api.serverUnavailable',
  503: 'errors.api.unavailable',
  504: 'errors.api.slow',
};

/** Undefined for a code this frontend has no copy for, so the caller can fall through. */
export function codeMessage(code: string | undefined): string | undefined {
  const key = code ? CODE_KEYS[code] : undefined;

  return key ? t(key) : undefined;
}

export function statusMessage(status: number): string {
  const key = STATUS_KEYS[status];

  return key ? t(key) : genericMessage();
}

export function networkMessage(): string {
  return t('errors.network.checkConnectionLong');
}

export function timeoutMessage(): string {
  return t('errors.network.timeout');
}

export function genericMessage(): string {
  return t('errors.api.unexpected');
}

export function kindForStatus(status: number): ApiErrorKind {
  switch (status) {
    case 400:
      return 'badRequest';
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 404:
      return 'notFound';
    case 409:
      return 'conflict';
    case 422:
      return 'validation';
    case 429:
      return 'rateLimited';
    case 502:
      return 'badGateway';
    case 503:
    case 504:
      return 'unavailable';
    default:
      return status >= 500 ? 'server' : 'unknown';
  }
}

/** Compares direction, a proxy for script that's exact only while every locale has a distinct one. */
export function isDisplayable(text: string | undefined): text is string {
  if (!isShowableText(text)) return false;
  // Null for no strong character at all (digits, punctuation) - no language, so the local copy wins.
  return detectDirection(text) === direction();
}

/** Locale-free: length/exception/stack/sql guards re-checked per read, since a queued failure outlives its locale. */
export function isShowableText(text: string | undefined): text is string {
  if (!text) return false;
  if (text.length > 200 || /exception|stack|at \w+\.|sql|connection string/i.test(text))
    return false;
  return true;
}

export function resolveUserMessage(
  code: string | undefined,
  status: number,
  serverMessage: string | undefined,
): string {
  const known = codeMessage(code);

  if (known) return known;
  if (isDisplayable(serverMessage)) return serverMessage;
  return statusMessage(status);
}
