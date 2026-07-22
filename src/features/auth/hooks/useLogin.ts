import { useState } from 'react';

import { ApiError, saveTokens } from '@/api';

import { loginWithEmail, loginWithPhone } from '../services/authService';

/**
 * The two login paths.
 *
 * Phone login sends an OTP and returns nothing to store; email login returns
 * tokens directly and persists them here.
 */
export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  /** Requests an OTP for the given number. Returns true if it was sent. */
  const requestPhoneOtp = async (phoneNumber: string): Promise<boolean> => {
    setIsLoading(true);
    setError('');

    try {
      await loginWithPhone(phoneNumber);
      return true;
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'تعذر إرسال رمز التحقق، حاول مرة أخرى',
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /** Signs in with email + password and stores the tokens. */
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
