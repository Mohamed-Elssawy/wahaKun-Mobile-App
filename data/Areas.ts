// data/areas.ts
import { LocationItem } from '../types/Location';

// Replace the ids below with the REAL ids used in your governorates.ts file —
// these must match `governorate.id` exactly, since that's the key used to
// look the areas up.
export const areasByGovernorateId: Record<string, LocationItem[]> = {
  '1': [
    { id: '101', name: 'مدينة نصر' },
    { id: '102', name: 'المعادي' },
    { id: '103', name: 'مصر الجديدة' },
    { id: '104', name: 'حلوان' },
    { id: '105', name: 'الزمالك' },
  ],
  '2': [
    { id: '201', name: 'الدقي' },
    { id: '202', name: 'العجوزة' },
    { id: '203', name: 'أكتوبر السادس' },
    { id: '204', name: 'الشيخ زايد' },
    { id: '205', name: 'الهرم' },
  ],
  '3': [
    { id: '301', name: 'محرم بك' },
    { id: '302', name: 'سيدي جابر' },
    { id: '303', name: 'العجمي' },
    { id: '304', name: 'المنتزه' },
  ],
  '4': [
    { id: '401', name: 'مرسى مطروح' },
    { id: '402', name: 'سيوة' },
    { id: '403', name: 'العلمين' },
  ],
  '5': [
    { id: '501', name: 'الخارجة' },
    { id: '502', name: 'الداخلة' },
    { id: '503', name: 'الفرافرة' },
    { id: '504', name: 'باريس' },
  ],
};

/**
 * Returns the areas that belong to a governorate, or an empty list if none is
 * selected yet / it has no data. Keeping this as a small pure function (rather
 * than inlining the lookup everywhere) makes it easy to swap for a real API
 * call later without touching the screen or the dropdown component.
 */
export const getAreasForGovernorate = (
  governorate: LocationItem | null,
): LocationItem[] => {
  if (!governorate) return [];
  return areasByGovernorateId[governorate.id] ?? [];
};