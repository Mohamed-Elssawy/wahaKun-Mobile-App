import { useCallback } from 'react';

import { clearTokens, getRefreshToken } from '@/api';
import { clearReportQueue } from '@/features/reports/services/reportQueue';

import { logout as revokeSession } from '../services/authService';

/** Ends the session everywhere it lives: the server token, the stored tokens, and the queue. */
export function useLogout() {
  return useCallback(async (): Promise<void> => {
    const refreshToken = await getRefreshToken();

    // Best effort: a failed revoke must not leave the farmer signed in on the device.
    if (refreshToken) {
      try {
        await revokeSession(refreshToken);
      } catch {
        // The local session is cleared regardless, so the device signs out either way.
      }
    }

    await clearTokens();
    // Queued reports belong to the session that just ended; a new login must not send them.
    await clearReportQueue();
  }, []);
}
