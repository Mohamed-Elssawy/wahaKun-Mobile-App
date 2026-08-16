import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, screenPadding, spacing } from '@/theme';

import { FlipCameraButton } from './FlipCameraButton';
import { GalleryButton } from './GalleryButton';
import { ShutterButton } from './ShutterButton';

export type CameraControlsBarProps = {
  onCapture: () => void;
  onFlip: () => void;
  onOpenGallery: () => void;
  canFlip: boolean;
};

/** Sits over the preview: vision-camera's SurfaceView paints the whole screen. */
export function CameraControlsBar({
  onCapture,
  onFlip,
  onOpenGallery,
  canFlip,
}: CameraControlsBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + spacing[24] }]}>
      {/* Three columns, so the shutter stays centred with or without a flip control. */}
      <View style={styles.side}>
        {canFlip ? <FlipCameraButton onPress={onFlip} /> : null}
      </View>

      <ShutterButton onPress={onCapture} />

      <View style={styles.side}>
        <GalleryButton onPress={onOpenGallery} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing[24],
    paddingHorizontal: screenPadding,
    // Approximates Figma's #4D4D4D at 70%, the closest scrim token the theme has.
    backgroundColor: colors.overlay,
  },
  // Equal flex on both sides is what centres the shutter, not a fixed margin.
  side: {
    flex: 1,
    alignItems: 'center',
  },
});
