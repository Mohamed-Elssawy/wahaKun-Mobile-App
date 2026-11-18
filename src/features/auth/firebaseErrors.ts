import { t } from '@/i18n';
import type { TranslationKey } from '@/i18n';

/** Keys, not resolved messages, so a module-scope map isn't built before §16.2 picks the locale. */
export const FIREBASE_ERROR_KEYS: Record<string, TranslationKey> = {
  'auth/invalid-phone-number': 'errors.auth.invalidPhone',
  'auth/missing-phone-number': 'errors.auth.phoneRequired',
  'auth/invalid-verification-code': 'errors.auth.wrongCode',
  'auth/missing-verification-code': 'errors.auth.codeIncomplete',
  // Firebase reports an expired code under either name depending on the platform.
  'auth/code-expired': 'errors.auth.codeExpired',
  'auth/session-expired': 'errors.auth.codeExpired',
  'auth/too-many-requests': 'errors.auth.tooManyAttempts',
  'auth/quota-exceeded': 'errors.auth.sendCodeUnavailable',
  'auth/network-request-failed': 'errors.network.checkConnection',
  'auth/user-disabled': 'errors.auth.accountDisabled',
  // Phone sign-in switched off in the console, but the farmer still needs a sentence.
  'auth/operation-not-allowed': 'errors.auth.phoneLoginOff',
  // A wrong SHA-1/SHA-256 fingerprint, a wrong package name, or Play Integrity left off.
  'auth/app-not-authorized': 'errors.auth.firebaseUnauthorised',
  'auth/invalid-app-credential': 'errors.auth.firebaseUnauthorised',
  'auth/missing-android-pkg-name': 'errors.auth.configIncomplete',
  // Silent app-verification (Play Integrity) or the reCAPTCHA fallback failed.
  'auth/captcha-check-failed': 'errors.auth.appCheckFailed',
  'auth/missing-client-identifier': 'errors.auth.appCheckFailed',
  'auth/app-not-authenticated': 'errors.auth.appCheckFailed',
  'auth/internal-error': 'errors.auth.internal',
  // Phone auth needs Blaze; on Spark, BILLING_NOT_ENABLED is truncated to this code.
  'auth/billing-not': 'errors.auth.smsDisabled',
};

/** Each caller passes its own fallback, since sending and verifying fail differently. */
export function describeFirebaseError(error: unknown, fallback: string): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';
  const key = FIREBASE_ERROR_KEYS[code];

  return key ? t(key) : fallback;
}
