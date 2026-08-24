import { Images } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';

import { colors } from '@/theme';

export type GalleryButtonProps = {
  onPress: () => void;
};

/** In the camera bar rather than behind a chooser: both sources share a review step. */
export function GalleryButton({ onPress }: GalleryButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel="اختيار صورة من المعرض"
    >
      <Images size={26} color={colors.textInverse} />
    </TouchableOpacity>
  );
}

const hitSlop = { top: 16, bottom: 16, left: 16, right: 16 };
