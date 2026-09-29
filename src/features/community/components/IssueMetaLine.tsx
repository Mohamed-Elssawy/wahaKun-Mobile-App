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

/**
 * The "منذ 45 دقيقة · 0.8 كم" line under an author's name, on the card and on F-04.
 *
 * Its own component because the two gaps differ and a single flat row cannot express that:
 * 4 between a glyph and its own label, 16 between one pair and the next, so the pairs read as
 * two facts rather than four fragments.
 */
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
