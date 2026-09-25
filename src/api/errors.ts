/** Status for failures that never reached the server (timeout, no connection). */
export const NETWORK_ERROR_STATUS = 0;

/** Every API failure is an ApiError so callers branch on status, not message text. */
export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    // Without this, `instanceof ApiError` is false when targeting ES5-era output.
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  get isNetworkError(): boolean {
    return this.status === NETWORK_ERROR_STATUS;
  }

  /** 401 only: the session is missing or expired, so re-authenticating can fix it. */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  /** 403: authenticated but not allowed. Re-login will not help, so callers must not retry. */
  get isForbidden(): boolean {
    return this.status === 403;
  }
}
