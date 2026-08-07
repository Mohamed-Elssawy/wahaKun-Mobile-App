import { ImageUp } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, screenPadding, spacing } from '@/theme';

export type UploadPhotoCardProps = {
  onPress: () => void;
};

const ICON_SIZE = 40;
const AVATAR_SIZE = 80;

/** Opens the same camera/gallery choice ProfilePictureScreen uses. */
export function UploadPhotoCard({ onPress }: UploadPhotoCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
    >
      <View style={styles.avatar}>
        <ImageUp size={ICON_SIZE} color={colors.textInverse} />
      </View>
      <View style={styles.text}>
        <Text variant="h4" color="textStrong" align="center">
          أرفق صورة
        </Text>
        <Text variant="body12" color="textMuted" align="center">
          اضغط لإضافة صورة من الكاميرا أو المعرض
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: spacing[16],
    paddingVertical: spacing[24],
    paddingHorizontal: screenPadding,
    borderRadius: radii[20],
    backgroundColor: colors.surface,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    gap: spacing[4],
  },
});
