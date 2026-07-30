/** The only file that imports @react-native-firebase. Sends the code, confirms it. */
import { getAuth, signInWithPhoneNumber } from '@react-native-firebase/auth';

import { toE164 } from '../phoneNumber';

import type { RegisterFields } from '../types';
import type { ConfirmationResult } from '@react-native-firebase/auth';

type PendingVerification = {
  phoneNumber: string;
  confirmation: ConfirmationResult;
  /** Sign-up fields: OtpScreen cannot reach the registration draft itself. */
  profile?: RegisterFields;
  /** Cached so a failed exchange can retry a code Firebase has already spent. */
  idToken?: string;
};

// Module state: a ConfirmationResult is a live session and cannot go in nav params.
let pending: PendingVerification | null = null;

export type ConfirmedVerification = {
  idToken: string;
  profile?: RegisterFields;
};

/** Replaces any verification already in flight, which is what makes resend safe. */
export async function sendVerificationCode(
  phoneNumber: string,
  profile?: RegisterFields,
): Promise<void> {
  const e164 = toE164(phoneNumber);
  const confirmation = await signInWithPhoneNumber(getAuth(), e164);

  pending = { phoneNumber: e164, confirmation, profile };
}

export async function confirmVerificationCode(
  code: string,
): Promise<ConfirmedVerification> {
  if (!pending) {
    throw new Error('No phone verification is in flight.');
  }

  if (pending.idToken) {
    return { idToken: pending.idToken, profile: pending.profile };
  }

  const credential = await pending.confirmation.confirm(code);

  // The interface promises a UserCredential but the class implementing it returns null too.
  if (!credential) {
    throw new Error('Firebase accepted the code without returning a user.');
  }

  const idToken = await credential.user.getIdToken();
  pending.idToken = idToken;

  return { idToken, profile: pending.profile };
}

/** Call once the tokens are safely stored, not before. */
export function resetPhoneVerification(): void {
  pending = null;
}
