import { Image, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { colors, spacing } from '@/theme';
import type { PickedImage } from '@/types/image';

import type { CaptureMode } from '../types';

export type PhotoReviewProps = {
  photo: PickedImage;
  /** Only decides how the "try again" action is worded. */
  mode: CaptureMode;
  isSubmitting: boolean;
  error?: string;
  onUse: () => void;
  onRetake: () => void;
};

/** Full-bleed on purpose: the farmer is checking the problem is legible before upload. */
export function PhotoReview({
  photo,
  mode,
  isSubmitting,
  error,
  onUse,
  onRetake,
}: PhotoReviewProps) {
  return (
    <>
      <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} />

      <View style={styles.bar}>
        {error ? (
          <Text variant="label14Bold" color="textInverse" align="center">
            {error}
          </Text>
        ) : null}

        <Button
          label="استخدام هذه الصورة"
          onPress={onUse}
          loading={isSubmitting}
          showArrow
        />
        <Button
          label={mode === 'camera' ? 'إعادة الالتقاط' : 'اختيار صورة أخرى'}
          variant="secondary"
          onPress={onRetake}
          disabled={isSubmitting}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing[24],
    gap: spacing[12],
    // Scrim: the buttons sit on an unknown photo, so they need their own ground.
    backgroundColor: colors.overlay,
  },
});
