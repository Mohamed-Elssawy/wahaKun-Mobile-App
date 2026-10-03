// Branch on status/code, never message text.

import { ApiError } from '@/api';

/**
 * Auth failures now carry a backend code (INVALID_CREDENTIALS, ACCOUNT_NOT_APPROVED,
 * USER_ALREADY_EXISTS…), which ApiError already turned into Arabic. Fall back to the
 * caller's copy only when the server gave nothing more specific than the HTTP status.
 */
export function describeAuthApiError(error: ApiError, fallback: string): string {
  if (error.isNetworkError) {
    return error.userMessage;
  }
  if (error.code && error.code !== 'SERVER_ERROR') {
    return error.userMessage;
  }
  return fallback;
}
