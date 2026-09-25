import { useState } from 'react';

import { ApiError } from '@/api';
import { RESET_PASSWORD_CLIENT_URL } from '@/config/env';

import { forgetPassword, resetPassword } from '../services/authService';

const REQUEST_ERROR = 'تعذر إرسال رابط الاستعادة، حاول مرة أخرى';
const RESET_ERROR = 'تعذر تغيير كلمة المرور، قد يكون الرابط منتهي الصلاحية';
const OFFLINE_ERROR = 'تحقق من اتصالك وحاول مرة أخرى';

// AuthService has no exception middleware: every fault is a 500 with no usable message, so only offline is distinguishable.
function describeResetError(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.isNetworkError) {
    return OFFLINE_ERROR;
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
      setRequestError(describeResetError(err, REQUEST_ERROR));
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
      setResetError(describeResetError(err, RESET_ERROR));
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
