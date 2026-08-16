import { SwitchCamera } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';

import { colors } from '@/theme';

export type FlipCameraButtonProps = {
  onPress: () => void;
};

export function FlipCameraButton({ onPress }: FlipCameraButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel="تبديل الكاميرا"
    >
      <SwitchCamera size={26} color={colors.textInverse} />
    </TouchableOpacity>
  );
}

const hitSlop = { top: 16, bottom: 16, left: 16, right: 16 };
