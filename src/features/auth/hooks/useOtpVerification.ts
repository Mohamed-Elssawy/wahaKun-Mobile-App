import { useState } from 'react';

import { ApiError, saveTokens } from '@/api';

import { describeFirebaseError } from '../firebaseErrors';
import { buildRegisterFormData, firebaseLogin, register } from '../services/authService';
import {
  confirmVerificationCode,
  resetPhoneVerification,
} from '../services/firebaseAuth';

/** Shared by both OTP steps, so it reports success and leaves navigation to the caller. */
export function useOtpVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  // Takes no phone number: the server reads it from the verified token, never from us.
  const verify = async (code: string): Promise<boolean> => {
    setIsVerifying(true);
    setError('');

    try {
      const { idToken, profile } = await confirmVerificationCode(code);

      // Two endpoints, not one. /Auth/Register takes the wizard's fields and the
      // token together; firebase-login takes the token alone and never creates a profile.
      const result = profile
        ? await register(buildRegisterFormData(profile, idToken))
        : await firebaseLogin(idToken);

      if (result.accessToken && result.refreshToken) {
        await saveTokens(result.accessToken, result.refreshToken);
      }

      // Only after storing, so a failed exchange leaves the token there to retry.
      resetPhoneVerification();
      return true;
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : describeFirebaseError(err, 'رمز التحقق غير صحيح، حاول مرة أخرى'),
      );
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  return { verify, isVerifying, error, setError };
}
