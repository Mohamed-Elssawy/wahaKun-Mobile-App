import { Droplet } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { describeTierDisplay } from '@/features/map/tier';
import type { MapIssueTier } from '@/features/map/types';
import { colors, radii, spacing } from '@/theme';

export type TierBadgeProps = {
  tier: MapIssueTier;
  label: string;
};

const ICON_SIZE = 14;

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
      <Text variant="label14Bold" color="textInverse">
        {label}
      </Text>
      <Droplet size={ICON_SIZE} color={colors.textInverse} fill={colors.textInverse} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[4],
    alignSelf: 'flex-start',
    minHeight: 32,
    paddingHorizontal: spacing[12],
    borderRadius: radii.pill,
  },
});
