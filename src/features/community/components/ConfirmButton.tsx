import { Check, TriangleAlert } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, controlHeight, radii, spacing } from '@/theme';

export type ConfirmButtonProps = {
  hasConfirmed: boolean;
  confirmations: number;
  onPress: () => void;
};

const LABEL = 'أواجه نفس المشكلة';
const COUNT_LABEL = 'تأكيدات';

const ICON_SIZE = 20;

// 36 in the frame, which is under Android's 48dp target, so the shortfall is made up in
// hitSlop rather than by drawing a taller button than the design.
const HEIGHT = 36;
const TOUCH_PADDING = (controlHeight - HEIGHT) / 2;

/**
 * "I have the same problem" — the vote on a feed card. Outlined when this farmer has not
 * confirmed, filled with a check once they have, which is how the frame draws both states.
 */
export function ConfirmButton({
  hasConfirmed,
  confirmations,
  onPress,
}: ConfirmButtonProps) {
  const Icon = hasConfirmed ? Check : TriangleAlert;
  const tint = hasConfirmed ? colors.textInverse : colors.primary;

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.button, hasConfirmed && styles.buttonConfirmed]}
        onPress={onPress}
        hitSlop={{ top: TOUCH_PADDING, bottom: TOUCH_PADDING }}
        accessibilityRole="button"
        accessibilityState={{ selected: hasConfirmed }}
        accessibilityLabel={LABEL}
      >
        {/* Leading, so row-reverse puts it to the right of the label. */}
        <Icon size={ICON_SIZE} color={tint} />

        <Text variant="h6" color={hasConfirmed ? 'textInverse' : 'primary'}>
          {LABEL}
        </Text>
      </TouchableOpacity>

      {/* Stacked, and stays at zero rather than hiding: the row's height must not jump on the
          first vote. */}
      <View style={styles.count} accessibilityRole="text">
        <Text variant="label16Bold" align="center">
          {confirmations}
        </Text>
        <Text variant="label12" color="textMuted" align="center">
          {COUNT_LABEL}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[16],
  },
  button: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[8],
    minHeight: HEIGHT,
    paddingHorizontal: spacing[16],
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonConfirmed: {
    backgroundColor: colors.primary,
  },
  count: {
    alignItems: 'center',
  },
});
