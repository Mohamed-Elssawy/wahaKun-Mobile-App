// Branch on status/code, never message text.

import { ApiError } from '@/api';

/** Falls back to the caller's copy only when the server named nothing more specific. */
export function describeAuthApiError(error: ApiError, fallback: string): string {
  if (error.isNetworkError) {
    return error.userMessage;
  }
  if (error.code && error.code !== 'SERVER_ERROR') {
    return error.userMessage;
  }
  return fallback;
}
