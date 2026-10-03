import { Sparkles } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/theme';

import { Text } from './Text';

export type AiConfidenceChipProps = {
  diagnosis: string;
  /** 0 to 1, as normalized by the service layer. */
  confidence: number;
  /** Which side of the 80% threshold this sits on. The caller decides - this file is
   * presentational only and may not read `CONFIDENCE_THRESHOLD` itself (ARCHITECTURE rule 2). */
  isConfident: boolean;
};

const CAPTION = 'ثقة';
const ICON_SIZE = 16;

/**
 * `C-CONFIDENCE-CHIP`, §8.3's E-01 card only: full-width, green above the 80% threshold,
 * amber below it. The only place a sub-threshold diagnosis is visible anywhere in the product.
 */
export function AiConfidenceChip({
  diagnosis,
  confidence,
  isConfident,
}: AiConfidenceChipProps) {
  const percent = Math.round(confidence * 100);

  return (
    <View
      style={[styles.chip, isConfident ? styles.chipConfident : styles.chipLow]}
      accessibilityRole="text"
      accessibilityLabel={`${diagnosis} — ${CAPTION} ${percent}%`}
    >
      <Sparkles
        size={ICON_SIZE}
        color={colors[isConfident ? 'primary' : 'warningText']}
      />

      <Text
        variant="label14Bold"
        color={isConfident ? 'textStrong' : 'warningText'}
        style={styles.diagnosis}
        numberOfLines={1}
      >
        {diagnosis}
      </Text>

      <Text variant="label14" color={isConfident ? 'textSecondary' : 'warningText'}>
        {`— ${CAPTION} ${percent}%`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[4],
    borderWidth: 1,
    borderRadius: radii[12],
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[12],
  },
  chipConfident: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primary,
  },
  chipLow: {
    backgroundColor: colors.warningTint,
    borderColor: colors.warning,
  },
  diagnosis: {
    flexShrink: 1,
  },
});
