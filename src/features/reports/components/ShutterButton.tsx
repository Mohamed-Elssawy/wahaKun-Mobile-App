import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { colors } from '@/theme';

export type ShutterButtonProps = {
  onPress: () => void;
};

/** Sized and coloured to stay legible over an arbitrary photo. */
export function ShutterButton({ onPress }: ShutterButtonProps) {
  return (
    <TouchableOpacity
      style={styles.ring}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel="التقاط صورة"
    >
      <View style={styles.core} />
    </TouchableOpacity>
  );
}

const RING_SIZE = 76;
const CORE_SIZE = 60;

const styles = StyleSheet.create({
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 4,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  core: {
    width: CORE_SIZE,
    height: CORE_SIZE,
    borderRadius: CORE_SIZE / 2,
    backgroundColor: colors.surface,
  },
});
