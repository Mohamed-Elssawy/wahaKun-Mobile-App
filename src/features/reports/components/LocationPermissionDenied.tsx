import { MapPinOff } from 'lucide-react-native';

import { StateScreen } from '@/components/ui';
import { t } from '@/i18n';

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
      title={t('x05.title')}
      message={t('x05.body')}
      action={{ label: t('common.openSettings'), onPress: onOpenSettings }}
    />
  );
}
