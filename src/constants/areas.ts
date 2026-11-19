import { t } from '@/i18n';
import type { TranslationKey } from '@/i18n';
import type { LocationItem } from '@/types/location';

// Keys must match governorate.id exactly, or the area list silently comes back empty.

// TODO: placeholder data, only New Valley ('8') is real - replace when an endpoint exists.
const AREA_KEYS: Record<string, { id: string; nameKey: TranslationKey }[]> = {
  '1': [
    { id: '101', nameKey: 'places.area.nasrCity' },
    { id: '102', nameKey: 'places.area.maadi' },
    { id: '103', nameKey: 'places.area.heliopolis' },
    { id: '104', nameKey: 'places.area.helwan' },
    { id: '105', nameKey: 'places.area.zamalek' },
  ],
  '2': [
    { id: '201', nameKey: 'places.area.dokki' },
    { id: '202', nameKey: 'places.area.agouza' },
    { id: '203', nameKey: 'places.area.sixthOctober' },
    { id: '204', nameKey: 'places.area.sheikhZayed' },
    { id: '205', nameKey: 'places.area.haram' },
  ],
  '3': [
    { id: '301', nameKey: 'places.area.moharramBek' },
    { id: '302', nameKey: 'places.area.sidiGaber' },
    { id: '303', nameKey: 'places.area.agami' },
    { id: '304', nameKey: 'places.area.montazah' },
  ],
  '4': [
    { id: '401', nameKey: 'places.area.marsaMatrouh' },
    { id: '402', nameKey: 'places.area.siwa' },
    { id: '403', nameKey: 'places.area.elAlamein' },
  ],
  '5': [
    { id: '501', nameKey: 'places.area.kharga' },
    { id: '502', nameKey: 'places.area.dakhla' },
    { id: '503', nameKey: 'places.area.farafra' },
    { id: '504', nameKey: 'places.area.baris' },
  ],
};

/**
 * A function, not a map, so this can become an API call without touching callers - which is
 * also why the keys above need no accessor of their own: the resolution happens here, at call
 * time, well after §16.2 has settled the locale.
 */
export const getAreasForGovernorate = (
  governorate: LocationItem | null,
): LocationItem[] => {
  if (!governorate) return [];
  return (AREA_KEYS[governorate.id] ?? []).map(({ id, nameKey }) => ({
    id,
    name: t(nameKey),
  }));
};
