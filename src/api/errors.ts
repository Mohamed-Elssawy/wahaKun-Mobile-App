import {
  GENERIC_MESSAGE,
  kindForStatus,
  NETWORK_MESSAGE,
  resolveUserMessage,
  TIMEOUT_MESSAGE,
} from './errorMessages.ts';

import type { ApiErrorKind } from './errorMessages.ts';

export const NETWORK_ERROR_STATUS = 0;

export type ApiErrorDetails = {
  method?: string;
  url?: string;
  code?: string;
  serverMessage?: string;
  fieldErrors?: Record<string, string[]>;
  traceId?: string;
  body?: unknown;
  cause?: unknown;
};

export class ApiError extends Error {
  readonly status: number;
  readonly kind: ApiErrorKind;
  readonly code?: string;
  readonly userMessage: string;
  readonly details: ApiErrorDetails;
  readonly body: unknown;

  constructor(
    status: number,
    kind: ApiErrorKind,
    userMessage: string,
    details: ApiErrorDetails = {},
  ) {
    super(userMessage);
    this.name = 'ApiError';
    this.status = status;
    this.kind = kind;
    this.code = details.code;
    this.userMessage = userMessage;
    this.details = details;
    this.body = details.body;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static fromResponse(status: number, details: ApiErrorDetails): ApiError {
    return new ApiError(
      status,
      kindForStatus(status),
      resolveUserMessage(details.code, status, details.serverMessage),
      details,
    );
  }
  static network(details: ApiErrorDetails): ApiError {
    return new ApiError(NETWORK_ERROR_STATUS, 'network', NETWORK_MESSAGE, details);
  }
  static timeout(details: ApiErrorDetails): ApiError {
    return new ApiError(NETWORK_ERROR_STATUS, 'timeout', TIMEOUT_MESSAGE, details);
  }

  get isNetworkError(): boolean {
    return this.status === NETWORK_ERROR_STATUS;
  }
  get isUnauthorized(): boolean {
    return this.status === 401;
  }
  get isForbidden(): boolean {
    return this.status === 403;
  }
  get isTransient(): boolean {
    return (
      this.isNetworkError ||
      [429, 502, 503, 504].includes(this.status) ||
      [
        'AI_SERVICE_UNAVAILABLE',
        'STORAGE_SERVICE_UNAVAILABLE',
        'DEPENDENCY_UNAVAILABLE',
      ].includes(this.code ?? '')
    );
  }

  toLogString(): string {
    const { method, url, code, serverMessage, traceId } = this.details;
    return [
      `[ApiError] ${method ?? ''} ${url ?? ''}`.trim(),
      `status=${this.status}`,
      `kind=${this.kind}`,
      code ? `code=${code}` : '',
      serverMessage ? `server="${serverMessage}"` : '',
      traceId ? `traceId=${traceId}` : '',
    ]
      .filter(Boolean)
      .join(' ');
  }
}

export function getErrorMessage(
  error: unknown,
  fallback: string = GENERIC_MESSAGE,
): string {
  return error instanceof ApiError ? error.userMessage || fallback : fallback;
}
