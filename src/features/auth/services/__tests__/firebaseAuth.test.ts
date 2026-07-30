import { signInWithPhoneNumber } from '@react-native-firebase/auth';

import {
  confirmVerificationCode,
  resetPhoneVerification,
  sendVerificationCode,
} from '../firebaseAuth';

import type { RegisterFields } from '../../types';

// Module state rots quietly, so what is pinned here is the lifecycle, not the happy path.
// The @react-native-firebase/auth mock lives in jest.setup.js; cases override it.
const signIn = signInWithPhoneNumber as unknown as jest.Mock;

const PROFILE: RegisterFields = {
  FullName: 'أحمد الراشدي',
  village: 'الواحة',
  Region: 'المنيا',
  email: 'ahmed@example.com',
  password: 'secret123',
  PhoneNumber: '+201001234567',
  picture: null,
};

/** A ConfirmationResult whose confirm() yields the given token, or no user. */
function confirmationYielding(idToken: string | null) {
  const getIdToken = jest.fn().mockResolvedValue(idToken);
  const confirm = jest
    .fn()
    .mockResolvedValue(idToken === null ? null : { user: { getIdToken } });

  return { verificationId: 'v-1', confirm, getIdToken };
}

describe('sendVerificationCode', () => {
  beforeEach(() => {
    resetPhoneVerification();
    jest.clearAllMocks();
  });

  it('normalises the number before Firebase ever sees it', async () => {
    signIn.mockResolvedValue(confirmationYielding('token'));

    await sendVerificationCode('+2001001234567');

    // The dial code is the app's, the zero is the farmer's, and Firebase takes neither.
    expect(signIn).toHaveBeenCalledWith(expect.anything(), '+201001234567');
  });

  it('replaces a verification already in flight, which is what makes resend safe', async () => {
    const first = confirmationYielding('first-token');
    const second = confirmationYielding('second-token');

    signIn.mockResolvedValueOnce(first).mockResolvedValueOnce(second);

    await sendVerificationCode('+201001234567');
    await sendVerificationCode('+201001234567');

    const confirmed = await confirmVerificationCode('123456');

    expect(confirmed.idToken).toBe('second-token');
    expect(first.confirm).not.toHaveBeenCalled();
  });
});

describe('confirmVerificationCode', () => {
  beforeEach(() => {
    resetPhoneVerification();
    jest.clearAllMocks();
  });

  it('returns the ID token and the fields stashed with it', async () => {
    signIn.mockResolvedValue(confirmationYielding('id-token'));

    await sendVerificationCode('+201001234567', PROFILE);
    const confirmed = await confirmVerificationCode('123456');

    expect(confirmed.idToken).toBe('id-token');
    expect(confirmed.profile).toEqual(PROFILE);
  });

  it('carries no fields on the login path', async () => {
    signIn.mockResolvedValue(confirmationYielding('id-token'));

    await sendVerificationCode('+201001234567');
    const confirmed = await confirmVerificationCode('123456');

    // firebase-login only reads the profile on create, so sending none keeps it a login.
    expect(confirmed.profile).toBeUndefined();
  });

  it('refuses when no code was ever sent', async () => {
    await expect(confirmVerificationCode('123456')).rejects.toThrow(
      /no phone verification/i,
    );
  });

  it('reuses the token rather than confirming a spent code twice', async () => {
    const confirmation = confirmationYielding('id-token');
    signIn.mockResolvedValue(confirmation);

    await sendVerificationCode('+201001234567');

    // Stands in for a failed exchange: Firebase has already consumed the code.
    const first = await confirmVerificationCode('123456');
    const retry = await confirmVerificationCode('123456');

    expect(retry.idToken).toBe(first.idToken);
    expect(confirmation.confirm).toHaveBeenCalledTimes(1);
  });

  it('refuses when Firebase accepts the code but returns no user', async () => {
    // The interface says this cannot happen; the class implementing it returns null.
    signIn.mockResolvedValue(confirmationYielding(null));

    await sendVerificationCode('+201001234567');

    await expect(confirmVerificationCode('123456')).rejects.toThrow(/without returning/i);
  });
});

describe('resetPhoneVerification', () => {
  it('clears the record so a later confirm cannot reuse it', async () => {
    signIn.mockResolvedValue(confirmationYielding('id-token'));

    await sendVerificationCode('+201001234567', PROFILE);
    resetPhoneVerification();

    await expect(confirmVerificationCode('123456')).rejects.toThrow(
      /no phone verification/i,
    );
  });
});
