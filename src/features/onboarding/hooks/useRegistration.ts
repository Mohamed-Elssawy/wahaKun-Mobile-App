import { useState } from 'react';

import { ApiError } from '@/api';
import { describeFirebaseError } from '@/features/auth/firebaseErrors';
import {
  buildRegisterFormData,
  createExpert,
} from '@/features/auth/services/authService';
import { sendVerificationCode } from '@/features/auth/services/firebaseAuth';
import type { RegisterFields } from '@/features/auth/types';

import type { RegistrationDraft } from '../context/RegistrationContext';

export type RegistrationOutcome = { status: 'otp-sent' } | { status: 'pending-approval' };

/** Farmers confirm an OTP; experts are created Pending for an admin and skip it. */
export function useRegistration() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (
    draft: RegistrationDraft,
    phoneNumber: string,
  ): Promise<RegistrationOutcome | null> => {
    setIsSubmitting(true);
    setError('');

    try {
      const fields: RegisterFields = {
        FullName: draft.fullName ?? '',
        village: draft.location?.name ?? '',
        Region: draft.governorate?.name ?? '',
        email: draft.email ?? '',
        password: draft.password ?? '',
        PhoneNumber: phoneNumber,
        picture: draft.profileImage ?? null,
      };

      // Above the flag: an expert never verifies a phone, so this path never changes.
      if (draft.role === 'expert') {
        await createExpert(buildRegisterFormData(fields));
        return { status: 'pending-approval' };
      }

      // The fields ride along because /Auth/Register wants them with the token.
      await sendVerificationCode(phoneNumber, fields);

      return { status: 'otp-sent' };
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : describeFirebaseError(err, 'حدث خطأ أثناء إنشاء الحساب، حاول مرة أخرى'),
      );
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submit, isSubmitting, error, setError };
}
