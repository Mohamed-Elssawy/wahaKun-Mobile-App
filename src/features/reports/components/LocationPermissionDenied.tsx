import { MapPinOff } from 'lucide-react-native';

import { StateScreen } from '@/components/ui';

export type LocationPermissionDeniedProps = {
  onOpenSettings: () => void;
};

/** X-05, D-HARD-BLOCK: location is mandatory, so this screen offers no way out at all. */
export function LocationPermissionDenied({
  onOpenSettings,
}: LocationPermissionDeniedProps) {
  return (
    <StateScreen
      icon={MapPinOff}
      title="لا يمكن الوصول إلى موقعك"
      message="فعّل إذن الموقع من الإعدادات لكي نتمكّن من الوصول لموقعك و حل مشكلتك."
      action={{ label: 'فتح الإعدادات', onPress: onOpenSettings }}
    />
  );
}
