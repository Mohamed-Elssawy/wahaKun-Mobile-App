import { useState } from 'react';

import { ApiError, saveTokens } from '@/api';

import { verifyOtp } from '../services/authService';

/**
 * Confirms an OTP and persists the returned tokens.
 *
 * Shared by the registration and login OTP steps, which differ only in where
 * they go next. `verify` therefore reports success and leaves navigation to
 * the caller.
 */
export function useOtpVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const verify = async (phoneNumber: string, code: string): Promise<boolean> => {
    setIsVerifying(true);
    setError('');

    try {
      const result = await verifyOtp(phoneNumber, code);

      if (result.accesstoken && result.refershtoken) {
        await saveTokens(result.accesstoken, result.refershtoken);
      }

      return true;
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'رمز التحقق غير صحيح، حاول مرة أخرى',
      );
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  return { verify, isVerifying, error, setError };
}
