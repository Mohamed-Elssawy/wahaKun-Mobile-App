import { useState } from 'react';

import { ApiError, saveTokens } from '@/api';

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
          ? err.message
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

      if (result.accessToken && result.refreshToken) {
        await saveTokens(result.accessToken, result.refreshToken);
      }

      return true;
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'حدث خطأ في الاتصال، حاول مرة أخرى',
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { requestPhoneOtp, signInWithEmail, isLoading, error, setError };
}
