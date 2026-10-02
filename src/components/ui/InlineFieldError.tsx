import { AlertCircle } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme';

import { Text } from './Text';

export type InlineFieldErrorProps = {
  /** Already Arabic and safe to show; validation copy belongs to the form. */
  message: string;
};

const ICON_SIZE = 16;

/**
 * SYSTEM-SPEC §5.4's inline register, which the design never drew. TextField renders it under
 * the box; a form with a non-field error renders it on its own.
 */
export function InlineFieldError({ message }: InlineFieldErrorProps) {
  return (
    // row-reverse: Figma draws this row LTR, but the message it carries is Arabic.
    <View style={styles.row}>
      <AlertCircle size={ICON_SIZE} color={colors.error} />
      <Text variant="label12Bold" color="errorText" align="right" style={styles.message}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[4],
  },
  message: {
    flex: 1,
  },
});
