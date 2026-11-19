import { DIAL_CODES } from '@/constants/countries';

// Longest dial code first, so a future +1x cannot be misread as +1.
const BY_LENGTH = [...DIAL_CODES].sort((a, b) => b.length - a.length);

/** Firebase only takes E.164, and a typed leading zero would make it a second account. */
export function toE164(phoneNumber: string): string {
  const compact = phoneNumber.replace(/[^\d+]/g, '');

  const dialCode = BY_LENGTH.find(code => compact.startsWith(code));

  if (!dialCode) {
    // Not a country the app offers, so let Firebase give the real reason.
    return compact;
  }

  const national = compact.slice(dialCode.length).replace(/^0+/, '');

  return `${dialCode}${national}`;
}

/** C26: shows `01012345678` as the owner would write it; safe since SPEC 8 S-03 locks the country to Egypt. */
export function toNationalDisplay(phoneNumber: string): string {
  const compact = phoneNumber.replace(/[^\d+]/g, '');

  const dialCode = BY_LENGTH.find(code => compact.startsWith(code));

  if (!dialCode) {
    return compact;
  }

  return `0${compact.slice(dialCode.length)}`;
}
