import { Image as ImageIcon } from 'lucide-react-native';
import { Alert, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';
import { t } from '@/i18n';
import { colors, radii, spacing } from '@/theme';
import type { PickedImage } from '@/types/image';

export type RepairPhotoUploadProps = {
  photo: PickedImage | null;
  error: string;
  onPickFromCamera: () => void;
  onPickFromGallery: () => void;
};

const CIRCLE_SIZE = 80;
const GLYPH_SIZE = 40;
const PHOTO_HEIGHT = 180;

/** No action-sheet component exists, so the camera/gallery choice reuses E-02's Alert pattern. */
export function RepairPhotoUpload({
  photo,
  error,
  onPickFromCamera,
  onPickFromGallery,
}: RepairPhotoUploadProps) {
  const openChooser = () => {
    Alert.alert(t('e04.addPhoto'), undefined, [
      { text: t('common.takePhoto'), onPress: onPickFromCamera },
      { text: t('common.chooseFromGallery'), onPress: onPickFromGallery },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  if (photo) {
    return (
      <TouchableOpacity onPress={openChooser} accessibilityRole="button">
        <Image source={{ uri: photo.uri }} style={styles.photo} />
        <Text
          variant="label14"
          color="primary"
          align="center"
          style={styles.replaceLabel}
        >
          {t('e04.changePhoto')}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={openChooser}
      accessibilityRole="button"
    >
      <View style={styles.circle}>
        {/* C82: picture icon, not camera - this photo is as likely to come from the gallery as the lens. */}
        <ImageIcon size={GLYPH_SIZE} color={colors.primaryPressed} />
      </View>

      <Text variant="h4" align="center">
        {t('e04.photoPrompt')}
      </Text>
      <Text variant="label14" color="textSecondary" align="center">
        {t('e04.photoHint')}
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
  // C82: white card matching E-04's surface, no stroke - a bordered grey tile read as a disabled field.
  card: {
    alignItems: 'center',
    gap: spacing[8],
    padding: spacing[24],
    borderRadius: radii[16],
    backgroundColor: colors.surface,
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
