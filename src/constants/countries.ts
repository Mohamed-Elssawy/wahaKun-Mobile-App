import { t } from '@/i18n';
import type { TranslationKey } from '@/i18n';

export type Country = {
  name: string;
  flag: string;
  dialCode: string;
  /** ISO 3166-1 alpha-2. */
  code: string;
};

// Egypt is first (primary market); keys plus a function, not a resolved const, since §16.2 resolves the locale after this module loads.
const COUNTRY_KEYS: {
  nameKey: TranslationKey;
  flag: string;
  dialCode: string;
  code: string;
}[] = [
  { nameKey: 'places.country.egypt', flag: '🇪🇬', dialCode: '+20', code: 'EG' },
  { nameKey: 'places.country.japan', flag: '🇯🇵', dialCode: '+81', code: 'JP' },
  { nameKey: 'places.country.saudiArabia', flag: '🇸🇦', dialCode: '+966', code: 'SA' },
  { nameKey: 'places.country.unitedStates', flag: '🇺🇸', dialCode: '+1', code: 'US' },
  { nameKey: 'places.country.unitedKingdom', flag: '🇬🇧', dialCode: '+44', code: 'GB' },
];

// Dial codes alone, so a module-scope consumer needs no locale (features/auth/phoneNumber sorts these once at import).
export const DIAL_CODES: string[] = COUNTRY_KEYS.map(country => country.dialCode);

/** Resolved per call. Country is unchanged, so PhoneField and the dropdown are untouched. */
export function countries(): Country[] {
  return COUNTRY_KEYS.map(({ nameKey, ...rest }) => ({ ...rest, name: t(nameKey) }));
}

export function defaultCountry(): Country {
  return countries()[0];
}
