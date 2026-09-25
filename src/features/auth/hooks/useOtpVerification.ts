import { useState } from 'react';

import { ApiError, saveTokens } from '@/api';
import { resumeReportQueue } from '@/features/reports/services/reportQueue';

import { describeAuthApiError } from '../authErrors';
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

      // Two endpoints: /Auth/Register creates the profile, firebase-login never does.
      const result = profile
        ? await register(buildRegisterFormData(profile, idToken))
        : await firebaseLogin(idToken);

      // No tokens means no session, so this is a failure whatever the status code said.
      if (!result.accessToken || !result.refreshToken) {
        setError('تعذر إكمال العملية، حاول مرة أخرى');
        return false;
      }

      await saveTokens(result.accessToken, result.refreshToken);
      // A new token can un-pause a queue that a prior expiry stopped.
      resumeReportQueue();

      // Only after storing, so a failed exchange leaves the token there to retry.
      resetPhoneVerification();
      return true;
    } catch (err) {
      setError(
        err instanceof ApiError
          ? describeAuthApiError(err, 'تعذر إكمال العملية، حاول مرة أخرى')
          : describeFirebaseError(err, 'رمز التحقق غير صحيح، حاول مرة أخرى'),
      );
      return false;
    } finally {
      setIsVerifying(false);
    }
  };

  return { verify, isVerifying, error, setError };
}
