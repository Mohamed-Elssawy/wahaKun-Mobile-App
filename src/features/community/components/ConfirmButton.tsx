import { Check, TriangleAlert } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';
import { t } from '@/i18n';
import { colors, controlHeight, radii, spacing } from '@/theme';

export type ConfirmButtonProps = {
  hasConfirmed: boolean;
  confirmations: number;
  onPress: () => void;
};

const ICON_SIZE = 20;

// 36 in the frame, under Android's 48dp target, so the shortfall goes into hitSlop.
const HEIGHT = 36;
const TOUCH_PADDING = (controlHeight - HEIGHT) / 2;

/** The vote on a feed card: outlined until this farmer confirms, filled with a check after. */
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
        accessibilityLabel={t('f01.corroborate')}
      >
        {/* Leading, so it takes the start edge beside the label. */}
        <Icon size={ICON_SIZE} color={tint} />

        <Text variant="h6" color={hasConfirmed ? 'textInverse' : 'primary'}>
          {t('f01.corroborate')}
        </Text>
      </TouchableOpacity>

      {/* Stacked, and stays at zero rather than hiding: the row's height must not jump on the first vote. */}
      <View style={styles.count} accessibilityRole="text">
        <Text variant="label16Bold" align="center">
          {confirmations}
        </Text>
        <Text variant="label12" color="textMuted" align="center">
          {t('f01.corroborationLabel')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[16],
  },
  button: {
    flex: 1,
    flexDirection: 'row',
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
