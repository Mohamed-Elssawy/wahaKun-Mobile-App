import { useState } from 'react';

import { ApiError } from '@/api';
import { RESET_PASSWORD_CLIENT_URL } from '@/config/env';
import { t } from '@/i18n';

import { forgetPassword, resetPassword } from '../services/authService';

// AuthService has no exception middleware: every fault is a 500, so only offline is distinguishable.
function describeResetError(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.isNetworkError) {
    return t('errors.network.checkConnection');
  }
  return fallback;
}

/** Requesting the link and consuming it are one hook: the same two-step server flow. */
export function usePasswordReset() {
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState('');

  /** Mails a link back to RESET_PASSWORD_CLIENT_URL carrying the token and the email. */
  const requestReset = async (email: string): Promise<boolean> => {
    setIsRequesting(true);
    setRequestError('');

    try {
      await forgetPassword(email, RESET_PASSWORD_CLIENT_URL);
      return true;
    } catch (err) {
      setRequestError(describeResetError(err, t('errors.auth.resetLinkFailed')));
      return false;
    } finally {
      setIsRequesting(false);
    }
  };

  const submitReset = async (
    email: string,
    token: string,
    password: string,
  ): Promise<boolean> => {
    setIsResetting(true);
    setResetError('');

    try {
      // The server compares the two itself, so the confirmation is sent, not just checked.
      await resetPassword(email, token, password, password);
      return true;
    } catch (err) {
      setResetError(describeResetError(err, t('errors.auth.changePasswordFailed')));
      return false;
    } finally {
      setIsResetting(false);
    }
  };

  return {
    requestReset,
    isRequesting,
    requestError,
    setRequestError,
    submitReset,
    isResetting,
    resetError,
    setResetError,
  };
}
