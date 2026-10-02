import { MicOff } from 'lucide-react-native';

import { StateScreen } from '@/components/ui';

export type MicrophonePermissionDeniedProps = {
  onOpenSettings: () => void;
  /** Switches to the صورة tab, the one way forward that needs no microphone. */
  onUsePhoto: () => void;
};

/** X-04. The mirror of X-03: same drawing, other permission, other way out. */
export function MicrophonePermissionDenied({
  onOpenSettings,
  onUsePhoto,
}: MicrophonePermissionDeniedProps) {
  return (
    <StateScreen
      icon={MicOff}
      title="لا يمكن الوصول إلى الميكروفون"
      message="فعّل إذن الميكروفون من الإعدادات لتسجيل وصف المشكلة."
      action={{ label: 'فتح الإعدادات', onPress: onOpenSettings }}
      secondaryAction={{ label: 'الإبلاغ بالصورة بدلاً من ذلك', onPress: onUsePhoto }}
    />
  );
}
