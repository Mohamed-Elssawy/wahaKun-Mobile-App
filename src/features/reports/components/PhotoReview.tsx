import { Repeat2 } from 'lucide-react-native';
import { Image, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Text } from '@/components/ui';
import { colors, screenPadding, spacing } from '@/theme';
import type { PickedImage } from '@/types/image';

import type { PhotoSource } from '../hooks/useReportCapture';

export type PhotoReviewProps = {
  photo: PickedImage;
  /** Only decides how the "try again" action is worded and what it does. */
  source: PhotoSource;
  isSubmitting: boolean;
  error?: string;
  onUse: () => void;
  onRetake: () => void;
};

const RETAKE_ICON_SIZE = 20;

/** F-02b. Full-bleed on purpose: the farmer is checking the problem is legible. */
export function PhotoReview({
  photo,
  source,
  isSubmitting,
  error,
  onUse,
  onRetake,
}: PhotoReviewProps) {
  const insets = useSafeAreaInsets();

  return (
    <>
      {/* cover, not the default: a portrait shot letterboxes in a landscape frame. */}
      <Image
        source={{ uri: photo.uri }}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      <View style={[styles.bar, { paddingBottom: insets.bottom + spacing[24] }]}>
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
          label={source === 'camera' ? 'إعادة الالتقاط' : 'اختيار صورة أخرى'}
          variant="secondary"
          onPress={onRetake}
          disabled={isSubmitting}
          icon={<Repeat2 size={RETAKE_ICON_SIZE} color={colors.primary} />}
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
    paddingTop: spacing[24],
    paddingHorizontal: screenPadding,
    gap: spacing[12],
    // Scrim: the buttons sit on an unknown photo, so they need their own ground.
    backgroundColor: colors.overlay,
  },
});
