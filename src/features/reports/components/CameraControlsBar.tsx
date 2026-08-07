import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, screenPadding, spacing } from '@/theme';

import { FlipCameraButton } from './FlipCameraButton';
import { ShutterButton } from './ShutterButton';

export type CameraControlsBarProps = {
  onCapture: () => void;
  onFlip: () => void;
  canFlip: boolean;
};

/** Sits over the preview: vision-camera's SurfaceView paints the whole screen. */
export function CameraControlsBar({
  onCapture,
  onFlip,
  canFlip,
}: CameraControlsBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + spacing[24] }]}>
      <View style={styles.center}>
        <ShutterButton onPress={onCapture} />
      </View>

      {canFlip ? (
        <View style={styles.flip}>
          <FlipCameraButton onPress={onFlip} />
        </View>
      ) : null}
    </View>
  );
}

const FLIP_BUTTON_SIZE = 26;

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: spacing[24],
    // Approximates Figma's #4D4D4D at 70%, the closest scrim token the theme has.
    backgroundColor: colors.overlay,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  flip: {
    position: 'absolute',
    left: screenPadding,
    top: '50%',
    marginTop: -FLIP_BUTTON_SIZE / 2,
  },
});
