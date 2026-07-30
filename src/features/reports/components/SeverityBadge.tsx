import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

import { SEVERITY_COLORS, SEVERITY_LABELS } from '../severity';

import type { Severity } from '../types';

export type SeverityBadgeProps = {
  severity: Severity;
};

/** The filled pill reading how serious the diagnosis is. */
export function SeverityBadge({ severity }: SeverityBadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: colors[SEVERITY_COLORS[severity]] }]}>
      <Text variant="label12Bold" color="textInverse">
        {SEVERITY_LABELS[severity]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    // Figma says 45dp wide, but "حرج جداً" is twice "حرج", so the label decides.
    height: 24,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
