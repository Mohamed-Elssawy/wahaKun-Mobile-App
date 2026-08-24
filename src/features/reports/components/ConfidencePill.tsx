import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, shadows, spacing } from '@/theme';

import { ProgressRing } from './ProgressRing';

export type ConfidencePillProps = {
  /** 0 to 1, as normalized by the service layer. */
  confidence: number;
};

const CAPTION = 'ثقة';
const RING_SIZE = 20;

/** Small and beside the severity badge, so the score reads as a footnote to the diagnosis. */
export function ConfidencePill({ confidence }: ConfidencePillProps) {
  const percent = Math.round(confidence * 100);

  return (
    <View
      style={styles.pill}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${CAPTION} ${percent}%`}
    >
      {/* row-reverse, so the caption reads rightmost and the ring anchors the left. */}
      <Text variant="label12" color="textSecondary">
        {CAPTION}
      </Text>
      <Text variant="label12Bold" color="textPrimary">
        {percent}%
      </Text>
      <ProgressRing progress={confidence} size={RING_SIZE} />
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[4],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[12],
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
});
