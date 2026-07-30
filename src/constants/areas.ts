import type { LocationItem } from '@/types/location';

// Keys must match governorate.id exactly, or the area list silently comes back empty.
// TODO: placeholder data. Only the New Valley entries are real. Replace when an endpoint exists.
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

/** A function, not a map, so this can become an API call without touching callers. */
export const getAreasForGovernorate = (
  governorate: LocationItem | null,
): LocationItem[] => {
  if (!governorate) return [];
  return areasByGovernorateId[governorate.id] ?? [];
};
