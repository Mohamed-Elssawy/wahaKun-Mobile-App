import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, spacing } from '@/theme';

/** The "أو" rule between the photo and voice options. */
export function CaptureDivider() {
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text variant="label20" color="textSubtle">
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
    gap: spacing.lg,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.textSubtle,
  },
});
