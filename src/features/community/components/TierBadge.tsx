import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { describeTierDisplay } from '@/features/map/tier';
import type { MapIssueTier } from '@/features/map/types';
import { colors, radii, spacing } from '@/theme';

import { SeverityDroplet } from './SeverityDroplet';

export type TierBadgeProps = {
  tier: MapIssueTier;
  label: string;
};

const ICON_SIZE = 12;

/** Measured off the frame: 26 tall, and the label's ink sits 15 in from each rounded end. */
const HEIGHT = 26;

/**
 * The filled severity pill on a feed card and over F-04's hero. Distinct from
 * reports/SeverityBadge, which reads the model's Arabic severity string; this one reads the
 * tier the map and the feed already agree on, so the card and the pin cannot disagree.
 */
export function TierBadge({ tier, label }: TierBadgeProps) {
  const { color } = describeTierDisplay(tier);

  return (
    <View
      style={[styles.badge, { backgroundColor: colors[color] }]}
      accessibilityRole="text"
      accessibilityLabel={`الخطورة: ${label}`}
    >
      {/* First child, so row-reverse puts the glyph on the leading edge - to the right of
          the label, which is where the frame draws every icon on these two screens. */}
      <SeverityDroplet tier={tier} color={colors.textInverse} size={ICON_SIZE} />

      <Text variant="h6" color="textInverse">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[4],
    alignSelf: 'flex-start',
    minHeight: HEIGHT,
    paddingHorizontal: spacing[12],
    borderRadius: radii.pill,
  },
});
