import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, spacing } from '@/theme';

import type { LucideIcon } from 'lucide-react-native';

export type IssueMetaLineProps = {
  icons: readonly LucideIcon[];
  /** Parallel to `icons`. An undefined label drops its pair rather than rendering an empty one. */
  labels: readonly (string | undefined)[];
};

const ICON_SIZE = 14;

/** Its own component because the gaps differ: 4 inside a pair, 16 between pairs. */
export function IssueMetaLine({ icons, labels }: IssueMetaLineProps) {
  return (
    <View style={styles.row}>
      {icons.map((Icon, index) => {
        const label = labels[index];
        if (!label) {
          return null;
        }

        return (
          <View key={index} style={styles.pair}>
            {/* Leading, so row-reverse puts the glyph to the right of its label. */}
            <Icon size={ICON_SIZE} color={colors.textMuted} />
            <Text variant="label12" color="textMuted">
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[16],
  },
  pair: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[4],
  },
});
