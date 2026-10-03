import { MapPinOff } from 'lucide-react-native';

import { StateScreen } from '@/components/ui';

export type LocationPermissionDeniedProps = {
  onOpenSettings: () => void;
};

/**
 * X-05. `D-HARD-BLOCK`: unlike `X-03`/`X-04` this has no tertiary way out. The absence is
 * deliberate - location is auto-captured, mandatory, and no report can be filed without it - so
 * this screen must not offer one.
 */
export function LocationPermissionDenied({
  onOpenSettings,
}: LocationPermissionDeniedProps) {
  return (
    <StateScreen
      icon={MapPinOff}
      title="لا يمكن الوصول إلى الموقع"
      message="نحتاج موقع المشكلة حتى يصل الخبير إليها — لا يمكن إرسال البلاغ بدونه."
      action={{ label: 'فتح الإعدادات', onPress: onOpenSettings }}
    />
  );
}
