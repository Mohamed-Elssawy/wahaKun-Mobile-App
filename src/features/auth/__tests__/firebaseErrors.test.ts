import { FIREBASE_ERROR_MESSAGES, describeFirebaseError } from '../firebaseErrors';

// Showing Firebase's own message would show the farmer someone else's debugging.
const FALLBACK = 'حدث خطأ';

/** Shaped like a NativeFirebaseError: a real Error that also carries a code. */
function firebaseError(code: string): Error {
  return Object.assign(new Error('Some English SDK text about reCAPTCHA.'), {
    code,
  });
}

describe('describeFirebaseError', () => {
  it('maps a wrong code to Arabic and ignores the English message', () => {
    const message = describeFirebaseError(
      firebaseError('auth/invalid-verification-code'),
      FALLBACK,
    );

    expect(message).toBe('رمز التحقق غير صحيح، حاول مرة أخرى');
    expect(message).not.toContain('reCAPTCHA');
  });

  it('reads both names Firebase uses for an expired code', () => {
    const expired = 'انتهت صلاحية الرمز، اطلب رمزاً جديداً';

    expect(describeFirebaseError(firebaseError('auth/code-expired'), FALLBACK)).toBe(
      expired,
    );
    expect(describeFirebaseError(firebaseError('auth/session-expired'), FALLBACK)).toBe(
      expired,
    );
  });

  it('says the same thing as the reports feature about being offline', () => {
    // Same problem to the farmer, so if the reports wording changes, change it here.
    expect(
      describeFirebaseError(firebaseError('auth/network-request-failed'), FALLBACK),
    ).toBe('تحقق من اتصالك وحاول مرة أخرى');
  });

  it('falls back for a code it has never seen', () => {
    expect(describeFirebaseError(firebaseError('auth/some-future-code'), FALLBACK)).toBe(
      FALLBACK,
    );
  });

  it('falls back for anything that is not a coded error', () => {
    expect(describeFirebaseError(new Error('plain'), FALLBACK)).toBe(FALLBACK);
    expect(describeFirebaseError('a string', FALLBACK)).toBe(FALLBACK);
    expect(describeFirebaseError(null, FALLBACK)).toBe(FALLBACK);
    expect(describeFirebaseError(undefined, FALLBACK)).toBe(FALLBACK);
  });

  it('never returns an empty message', () => {
    // A blank error is worse than a wrong one: the form just looks like it refused.
    for (const message of Object.values(FIREBASE_ERROR_MESSAGES)) {
      expect(message.trim().length).toBeGreaterThan(0);
    }
  });
});
