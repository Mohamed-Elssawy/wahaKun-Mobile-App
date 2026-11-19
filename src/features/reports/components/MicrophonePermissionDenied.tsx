import { MicOff } from 'lucide-react-native';

import { StateScreen } from '@/components/ui';
import { t } from '@/i18n';

export type MicrophonePermissionDeniedProps = {
  onOpenSettings: () => void;
  /** Focuses the text field in voice mode, which needs no microphone, so it is one step. */
  onUseText: () => void;
};

/** X-04. The mirror of X-03: same drawing, other permission, other way out. */
export function MicrophonePermissionDenied({
  onOpenSettings,
  onUseText,
}: MicrophonePermissionDeniedProps) {
  return (
    <StateScreen
      icon={MicOff}
      title={t('x04.title')}
      message={t('x04.body')}
      action={{ label: t('common.openSettings'), onPress: onOpenSettings }}
      secondaryAction={{ label: t('x04.writeInstead'), onPress: onUseText }}
    />
  );
}
