import { useState } from 'react';

import { ApiError, saveTokens } from '@/api';
import { resumeReportQueue } from '@/features/reports/services/reportQueue';

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
          ? describeAuthApiError(err, 'تعذر إرسال رمز التحقق، حاول مرة أخرى')
          : describeFirebaseError(err, 'تعذر إرسال رمز التحقق، حاول مرة أخرى'),
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
        setError('تعذر تسجيل الدخول، حاول مرة أخرى');
        return false;
      }

      await saveTokens(result.accessToken, result.refreshToken);
      // A new token can un-pause a queue that a prior expiry stopped.
      resumeReportQueue();

      return true;
    } catch (err) {
      setError(
        err instanceof ApiError
          ? describeAuthApiError(
              err,
              'تعذر تسجيل الدخول، تأكد من البيانات وحاول مرة أخرى',
            )
          : 'حدث خطأ في الاتصال، حاول مرة أخرى',
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { requestPhoneOtp, signInWithEmail, isLoading, error, setError };
}
