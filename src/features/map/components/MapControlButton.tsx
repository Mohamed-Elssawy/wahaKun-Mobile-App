import { StyleSheet, TouchableOpacity } from 'react-native';

import { colors, radii, shadows } from '@/theme';

import type { ReactNode } from 'react';

export type MapControlButtonProps = {
  icon: ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
};

/** F-05 draws search and recenter as one control, so they are one component. */
export const MAP_CONTROL_SIZE = 45;
export const MAP_CONTROL_ICON = 24;

export function MapControlButton({
  icon,
  onPress,
  accessibilityLabel,
}: MapControlButtonProps) {
  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {icon}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: MAP_CONTROL_SIZE,
    height: MAP_CONTROL_SIZE,
    borderRadius: radii[12],
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
});
