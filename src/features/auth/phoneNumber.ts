import { COUNTRIES } from '@/constants/countries';

// Longest dial code first, so a future +1x cannot be misread as +1.
const DIAL_CODES = COUNTRIES.map(country => country.dialCode).sort(
  (a, b) => b.length - a.length,
);

/** Firebase only takes E.164, and a typed leading zero would make it a second account. */
export function toE164(phoneNumber: string): string {
  const compact = phoneNumber.replace(/[^\d+]/g, '');

  const dialCode = DIAL_CODES.find(code => compact.startsWith(code));

  if (!dialCode) {
    // Not a country the app offers, so let Firebase give the real reason.
    return compact;
  }

  const national = compact.slice(dialCode.length).replace(/^0+/, '');

  return `${dialCode}${national}`;
}
