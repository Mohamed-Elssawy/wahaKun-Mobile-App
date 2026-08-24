import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

import type { ReactNode } from 'react';

const CIRCLE_SIZE = 56;

export type PhotoTipTileProps = {
  /** Sized by the caller: F-03c draws these at 28 on a 56 disc. */
  icon: ReactNode;
  label: string;
};

/** One of F-03c's three tiles: what a photo the model can read looks like. */
export function PhotoTipTile({ icon, label }: PhotoTipTileProps) {
  return (
    <View style={styles.tile}>
      <View style={styles.circle}>{icon}</View>

      <Text variant="label14" color="textStrong" align="center">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    // flex, not the frame's 104: three tiles plus two gaps fill the row at any width.
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii[16],
    paddingTop: spacing[12],
    // The 24 sides are what wrap the labels the way the frame does.
    paddingHorizontal: spacing[24],
    paddingBottom: spacing[24],
    gap: spacing[12],
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
