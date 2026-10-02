import { CameraOff } from 'lucide-react-native';

import { StateScreen } from '@/components/ui';

export type CameraPermissionDeniedProps = {
  onOpenSettings: () => void;
  /** Switches to the صوت tab, the one way forward that needs no camera. */
  onUseVoice: () => void;
};

/** X-03. Kept inside F-02, so the header's back and the mode toggle stay reachable. */
export function CameraPermissionDenied({
  onOpenSettings,
  onUseVoice,
}: CameraPermissionDeniedProps) {
  return (
    <StateScreen
      icon={CameraOff}
      title="لا يمكن الوصول إلى الكاميرا"
      message="فعّل إذن الكاميرا من الإعدادات لتصوير المشكلة."
      action={{ label: 'فتح الإعدادات', onPress: onOpenSettings }}
      secondaryAction={{ label: 'الإبلاغ بالصوت بدلاً من ذلك', onPress: onUseVoice }}
    />
  );
}
