import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, spacing } from '@/theme';

/** The "أو" rule between the photo and voice options. */
export function CaptureDivider() {
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text variant="label20" color="textMuted">
        أو
      </Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[16],
  },
  line: {
    flex: 1,
    height: 1,
    // borderStrong, not divider: this rule separates two equal-weight choices
    // and has to hold its own next to them. It used to borrow a text colour.
    backgroundColor: colors.borderStrong,
  },
});
