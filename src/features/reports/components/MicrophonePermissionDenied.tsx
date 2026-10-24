import { MicOff } from 'lucide-react-native';

import { StateScreen } from '@/components/ui';

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
      title="لا يمكن الوصول إلى الميكروفون"
      message="فعّل إذن الميكروفون من الإعدادات لتسجيل وصف المشكلة."
      action={{ label: 'فتح الإعدادات', onPress: onOpenSettings }}
      secondaryAction={{ label: 'أو اكتب وصف المشكلة', onPress: onUseText }}
    />
  );
}
