import { useState } from 'react';

import { ApiError, saveTokens } from '@/api';
import { resumeReportQueue } from '@/features/reports/services/reportQueue';
import { t } from '@/i18n';

import { describeAuthApiError } from '../authErrors';
import { describeFirebaseError } from '../firebaseErrors';
import { loginWithEmail } from '../services/authService';
import { sendVerificationCode } from '../services/firebaseAuth';

/** Phone login returns nothing to store; email login returns tokens and is saved here. */
export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  /** Firebase texts anyone, so /Auth/Login's rejection of unknown numbers is gone. */
  const requestPhoneOtp = async (phoneNumber: string): Promise<boolean> => {
    setIsLoading(true);
    setError('');

    try {
      await sendVerificationCode(phoneNumber);
      return true;
    } catch (err) {
      setError(
        err instanceof ApiError
          ? describeAuthApiError(err, t('errors.auth.sendCodeFailed'))
          : describeFirebaseError(err, t('errors.auth.sendCodeFailed')),
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError('');

    try {
      const result = await loginWithEmail(email, password);

      // No tokens means no session, so this is a failure however the server dressed it up.
      if (!result.accessToken || !result.refreshToken) {
        setError(t('errors.auth.loginFailed'));
        return false;
      }

      await saveTokens(result.accessToken, result.refreshToken);
      // A new token can un-pause a queue that a prior expiry stopped.
      resumeReportQueue();

      return true;
    } catch (err) {
      setError(
        err instanceof ApiError
          ? describeAuthApiError(err, t('errors.auth.loginFailedDetail'))
          : t('errors.network.generic'),
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { requestPhoneOtp, signInWithEmail, isLoading, error, setError };
}
