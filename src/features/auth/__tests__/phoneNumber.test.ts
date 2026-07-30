import { toE164 } from '../phoneNumber';

// Getting the leading zero wrong gives a farmer a second empty account, not an error.
describe('toE164', () => {
  it('drops the leading zero the dial code makes redundant', () => {
    expect(toE164('+2001001234567')).toBe('+201001234567');
  });

  it('drops however many zeros were typed', () => {
    expect(toE164('+200001001234567')).toBe('+201001234567');
  });

  it('leaves an already-correct number alone', () => {
    expect(toE164('+201001234567')).toBe('+201001234567');
  });

  it('strips formatting the user did not intend', () => {
    expect(toE164('+20 100 123 4567')).toBe('+201001234567');
    expect(toE164('+20-100-123-4567')).toBe('+201001234567');
  });

  it('matches the longest dial code, not the first', () => {
    // +966 must not be read as +9 or +96, neither of which is in the list.
    expect(toE164('+9660501234567')).toBe('+966501234567');
    expect(toE164('+4407911123456')).toBe('+447911123456');
  });

  it('passes through a country the app does not offer', () => {
    // No dial code matches, so there is no way to know where the zero belongs.
    expect(toE164('+9990501234567')).toBe('+9990501234567');
  });

  it('leaves a number with no country code untouched', () => {
    expect(toE164('01001234567')).toBe('01001234567');
  });
});
