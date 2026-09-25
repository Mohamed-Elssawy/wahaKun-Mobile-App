// Branch on status, never message text: AuthService's copy is not always Arabic.

import { ApiError } from '@/api';

const OFFLINE_MESSAGE = 'تحقق من اتصالك وحاول مرة أخرى';

/** Non-network errors fall back to the caller's copy: AuthService bodies carry no usable message. */
export function describeAuthApiError(error: ApiError, fallback: string): string {
  if (error.isNetworkError) {
    return OFFLINE_MESSAGE;
  }
  return fallback;
}
