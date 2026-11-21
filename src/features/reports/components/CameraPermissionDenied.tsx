import { CameraOff } from 'lucide-react-native';

import { StateScreen } from '@/components/ui';
import { t } from '@/i18n';

export type CameraPermissionDeniedProps = {
  onOpenSettings: () => void;
  /** Switches to the صوت tab, the one way forward that needs no camera. */
  onUseVoice: () => void;
};

/** X-03. F-02 renders it full-screen, so its link is the one way to the صوت tab from here. */
export function CameraPermissionDenied({
  onOpenSettings,
  onUseVoice,
}: CameraPermissionDeniedProps) {
  return (
    <StateScreen
      icon={CameraOff}
      title={t('x03.title')}
      message={t('x03.body')}
      action={{ label: t('common.openSettings'), onPress: onOpenSettings }}
      secondaryAction={{ label: t('x03.useVoiceInstead'), onPress: onUseVoice }}
    />
  );
}
