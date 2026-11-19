import { t } from '@/i18n';
import type { TranslationKey } from '@/i18n';
import type { LocationItem } from '@/types/location';

// App-authored data, so it translates (SPEC §16.8); keys plus a function, not a resolved const, since §16.2 resolves the locale after this module loads.
const GOVERNORATE_KEYS: { id: string; nameKey: TranslationKey }[] = [
  { id: '1', nameKey: 'places.gov.cairo' },
  { id: '2', nameKey: 'places.gov.giza' },
  { id: '3', nameKey: 'places.gov.alexandria' },
  { id: '4', nameKey: 'places.gov.matrouh' },
  { id: '5', nameKey: 'places.gov.faiyum' },
  { id: '6', nameKey: 'places.gov.beheira' },
  { id: '7', nameKey: 'places.gov.kafrElSheikh' },
  { id: '8', nameKey: 'places.gov.newValley' },
  { id: '9', nameKey: 'places.gov.minya' },
  { id: '10', nameKey: 'places.gov.asyut' },
];

// Resolved per call; item shape is unchanged, so LocationItem and SearchableDropdown stay untouched.
export function governorates(): LocationItem[] {
  return GOVERNORATE_KEYS.map(({ id, nameKey }) => ({ id, name: t(nameKey) }));
}
