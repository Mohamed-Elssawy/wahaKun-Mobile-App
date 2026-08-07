import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

import type { LucideIcon } from 'lucide-react-native';

export type SolutionRowProps = {
  icon: LucideIcon;
  label: string;
  value: string;
};

const DISC_SIZE = 32;
const ICON_SIZE = 16;

/** row-reverse puts the disc on the right, where the eye starts in Arabic. */
export function SolutionRow({ icon: Icon, label, value }: SolutionRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.disc}>
        <Icon size={ICON_SIZE} color={colors.textInverse} />
      </View>

      <View style={styles.text}>
        <Text variant="label12" color="textMuted" align="right">
          {label}
        </Text>
        <Text variant="body14" align="right">
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    // Top, not centre: a wrapped value should leave the disc level with its label.
    alignItems: 'flex-start',
    gap: spacing[12],
  },
  disc: {
    width: DISC_SIZE,
    height: DISC_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: spacing[2],
  },
});
