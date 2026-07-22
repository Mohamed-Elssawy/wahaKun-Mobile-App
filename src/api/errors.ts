/** Status used for failures that never reached the server (timeout, no network). */
export const NETWORK_ERROR_STATUS = 0;

/**
 * Every failure surfaced by the API layer is an ApiError, so callers can
 * branch on `status` instead of string-matching messages.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    // Required for `instanceof` to work when targeting ES5-era output.
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /** True when the request never got a response (timeout / connection failure). */
  get isNetworkError(): boolean {
    return this.status === NETWORK_ERROR_STATUS;
  }

  /** True when the token is missing, expired or rejected. */
  get isUnauthorized(): boolean {
    return this.status === 401 || this.status === 403;
  }
}
