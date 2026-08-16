import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

import { describeSeverity } from '../severity';

import type { Severity } from '../types';

export type SeverityBadgeProps = {
  severity: Severity;
};

/** The filled pill reading how serious the diagnosis is. */
export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const { label, color } = describeSeverity(severity);

  return (
    <View style={[styles.badge, { backgroundColor: colors[color] }]}>
      <Text variant="label12Bold" color="textInverse">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    // The label decides the width; Figma's 45dp does not fit all three tier labels.
    minHeight: 24,
    paddingHorizontal: spacing[12],
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
