import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

export type ProgressBarProps = {
  /** 1-based index of the current step. */
  step: number;
  /** Total number of steps. */
  totalSteps: number;
};

/** Wizard progress indicator. The fill is a percentage, never a pixel width. */
export function ProgressBar({ step, totalSteps }: ProgressBarProps) {
  const ratio = totalSteps > 0 ? Math.min(Math.max(step / totalSteps, 0), 1) : 0;

  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: totalSteps, now: step }}
    >
      <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    height: 4,
    backgroundColor: colors.border,
  },
  fill: {
    height: 4,
    backgroundColor: colors.textPrimary,
    // RTL: progress grows from the right edge.
    alignSelf: 'flex-end',
  },
});
