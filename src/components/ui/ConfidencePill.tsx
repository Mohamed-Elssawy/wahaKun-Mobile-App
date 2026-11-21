import { StyleSheet, View } from 'react-native';

import { t } from '@/i18n';
import { colors, radii, shadows, spacing } from '@/theme';

import { ProgressRing } from './ProgressRing';
import { Text } from './Text';

export type ConfidencePillProps = {
  /** 0 to 1, as normalized by the service layer. */
  confidence: number;
};

const RING_SIZE = 20;

/** Small and beside the severity badge, so the score reads as a footnote to the diagnosis. */
export function ConfidencePill({ confidence }: ConfidencePillProps) {
  const percent = Math.round(confidence * 100);

  return (
    <View
      style={styles.pill}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={t('common.confidencePercent', { percent })}
    >
      {/* C48: F-03a reads figure, then caption, then ring in both locales - the layout's order, not the copy's. */}
      <Text variant="label12Bold" color="textPrimary" style={styles.percent}>
        {percent}%
      </Text>
      <Text variant="label12" color="textSecondary">
        {t('common.confidence')}
      </Text>
      <ProgressRing progress={confidence} size={RING_SIZE} />
    </View>
  );
}

const styles = StyleSheet.create({
  // A percentage is an LTR island in both locales (SPEC 6.7).
  percent: { writingDirection: 'ltr' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[12],
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
});
