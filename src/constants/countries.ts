export type Country = {
  name: string;
  flag: string;
  dialCode: string;
  /** ISO 3166-1 alpha-2. */
  code: string;
};

/**
 * Countries offered in the phone-number picker. Egypt is first because it is
 * the primary market for the oasis communities this app serves.
 */
export const COUNTRIES: Country[] = [
  { name: 'مصر', flag: '🇪🇬', dialCode: '+20', code: 'EG' },
  { name: 'اليابان', flag: '🇯🇵', dialCode: '+81', code: 'JP' },
  { name: 'السعودية', flag: '🇸🇦', dialCode: '+966', code: 'SA' },
  { name: 'الولايات المتحدة', flag: '🇺🇸', dialCode: '+1', code: 'US' },
  { name: 'المملكة المتحدة', flag: '🇬🇧', dialCode: '+44', code: 'GB' },
];

export const DEFAULT_COUNTRY = COUNTRIES[0];
