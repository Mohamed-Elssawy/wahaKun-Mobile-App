// Branch on code, never message: Firebase's text is English and changes between versions.
export const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  'auth/invalid-phone-number': 'رقم الهاتف غير صحيح، تأكد منه وحاول مرة أخرى',
  'auth/missing-phone-number': 'يرجى إدخال رقم الهاتف',
  'auth/invalid-verification-code': 'رمز التحقق غير صحيح، حاول مرة أخرى',
  'auth/missing-verification-code': 'يرجى إدخال رمز التحقق كاملاً',
  // Firebase reports an expired code under either name depending on the platform.
  'auth/code-expired': 'انتهت صلاحية الرمز، اطلب رمزاً جديداً',
  'auth/session-expired': 'انتهت صلاحية الرمز، اطلب رمزاً جديداً',
  'auth/too-many-requests': 'محاولات كثيرة، انتظر قليلاً ثم حاول مرة أخرى',
  'auth/quota-exceeded': 'تعذر إرسال رمز التحقق حالياً، حاول لاحقاً',
  'auth/network-request-failed': 'تحقق من اتصالك وحاول مرة أخرى',
  'auth/user-disabled': 'هذا الحساب موقوف، تواصل مع الدعم',
  // Phone sign-in switched off in the console, but the farmer still needs a sentence.
  'auth/operation-not-allowed': 'تسجيل الدخول بالهاتف غير مفعّل حالياً',
};

/** Each caller passes its own fallback, since sending and verifying fail differently. */
export function describeFirebaseError(error: unknown, fallback: string): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';

  return FIREBASE_ERROR_MESSAGES[code] ?? fallback;
}
