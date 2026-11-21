import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { t } from '@/i18n';
import { colors, spacing } from '@/theme';

/** The {t('common.or')} rule between the photo and voice options. */
export function CaptureDivider() {
  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text variant="label20" color="textMuted">
        {t('common.or')}
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
    // borderStrong, not divider: this rule separates two equal-weight choices.
    backgroundColor: colors.borderStrong,
  },
});
