import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, shadows } from '@/theme';

import { describeTierDisplay } from '../tier';

import type { MapIssueTier } from '../types';

export type MapClusterPinProps = {
  tier: MapIssueTier;
  count: number;
};

// F-05 zoomed out: a 50 white circle with a 4 ring and the count, both in the tier colour.
const SIZE = 50;
const RING = 4;

/** Several issues collapsed behind a count, coloured by the worst one it holds. */
export function MapClusterPin({ tier, count }: MapClusterPinProps) {
  const { color } = describeTierDisplay(tier);

  return (
    <View
      style={[styles.cluster, { borderColor: colors[color] }]}
      accessibilityLabel={`${count} بلاغات`}
    >
      <Text variant="label20Bold" color={color}>
        {String(count)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cluster: {
    width: SIZE,
    height: SIZE,
    borderRadius: radii.pill,
    borderWidth: RING,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
});
