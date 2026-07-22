import { useState } from 'react';

import { ApiError } from '@/api';
import {
  buildRegisterFormData,
  createExpert,
  register,
} from '@/features/auth/services/authService';

import type { RegistrationDraft } from '../context/RegistrationContext';

export type RegistrationOutcome =
  /** Farmer sign-up: an OTP was sent and must be confirmed. */
  | { status: 'otp-sent' }
  /** Expert sign-up: account created as Pending, no OTP step. */
  | { status: 'pending-approval' };

/**
 * Submits the registration wizard.
 *
 * The farmer/expert branch lives here rather than in the phone screen's JSX:
 * farmers get an OTP to confirm, experts are created as "Pending" for an admin
 * to approve and skip verification entirely.
 */
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
      const formData = buildRegisterFormData({
        FullName: draft.fullName ?? '',
        village: draft.location?.name ?? '',
        Region: draft.governorate?.name ?? '',
        email: draft.email ?? '',
        password: draft.password ?? '',
        PhoneNumber: phoneNumber,
        picture: draft.profileImage ?? null,
      });

      if (draft.role === 'expert') {
        await createExpert(formData);
        return { status: 'pending-approval' };
      }

      await register(formData);
      return { status: 'otp-sent' };
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'حدث خطأ أثناء إنشاء الحساب، حاول مرة أخرى',
      );
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submit, isSubmitting, error, setError };
}
