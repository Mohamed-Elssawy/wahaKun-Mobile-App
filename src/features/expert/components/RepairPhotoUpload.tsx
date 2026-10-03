import { Camera } from 'lucide-react-native';
import { Alert, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';
import type { PickedImage } from '@/types/image';

export type RepairPhotoUploadProps = {
  photo: PickedImage | null;
  error: string;
  onPickFromCamera: () => void;
  onPickFromGallery: () => void;
};

const CIRCLE_SIZE = 64;
const GLYPH_SIZE = 28;
const PHOTO_HEIGHT = 180;
const TITLE = 'أرفق صورة لإثبات إصلاح المشكلة';
const SUBTITLE = 'اضغط لإضافة صورة من الكاميرا أو المعرض';
const REPLACE_LABEL = 'اضغط لتغيير الصورة';
const CHOOSER_TITLE = 'إضافة صورة';
const CAMERA_LABEL = 'التقاط صورة';
const GALLERY_LABEL = 'اختيار من المعرض';
const CANCEL_LABEL = 'إلغاء';

/** §8.3's E-04 upload card. No action-sheet component exists yet and two options don't need
 * one, so the camera/gallery choice reuses the same `Alert.alert` pattern E-02 already does. */
export function RepairPhotoUpload({
  photo,
  error,
  onPickFromCamera,
  onPickFromGallery,
}: RepairPhotoUploadProps) {
  const openChooser = () => {
    Alert.alert(CHOOSER_TITLE, undefined, [
      { text: CAMERA_LABEL, onPress: onPickFromCamera },
      { text: GALLERY_LABEL, onPress: onPickFromGallery },
      { text: CANCEL_LABEL, style: 'cancel' },
    ]);
  };

  if (photo) {
    return (
      <TouchableOpacity onPress={openChooser} accessibilityRole="button">
        <Image source={{ uri: photo.uri }} style={styles.photo} />
        <Text variant="label14" color="primary" align="center" style={styles.replaceLabel}>
          {REPLACE_LABEL}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={openChooser} accessibilityRole="button">
      <View style={styles.circle}>
        <Camera size={GLYPH_SIZE} color={colors.primaryPressed} />
      </View>

      <Text variant="h5" align="center">
        {TITLE}
      </Text>
      <Text variant="label14" color="textSecondary" align="center">
        {SUBTITLE}
      </Text>

      {error ? (
        <Text variant="label12" color="errorText" align="center">
          {error}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: spacing[8],
    padding: spacing[24],
    borderRadius: radii[16],
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryTint,
  },
  photo: {
    width: '100%',
    height: PHOTO_HEIGHT,
    borderRadius: radii[16],
    backgroundColor: colors.surfaceMuted,
  },
  replaceLabel: {
    marginTop: spacing[8],
  },
});
