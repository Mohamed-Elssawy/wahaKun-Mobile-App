import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';
import type { ColorToken } from '@/theme';

export type ProgressBarProps = {
  /** 1-based index of the current step. */
  step: number;
  totalSteps: number;
  /** The wizard's dark fill by default; F-07 passes 'primary' for its green bar. */
  color?: ColorToken;
};

/** Wizard progress indicator. The fill is a percentage, never a pixel width. */
export function ProgressBar({
  step,
  totalSteps,
  color = 'textPrimary',
}: ProgressBarProps) {
  const ratio = totalSteps > 0 ? Math.min(Math.max(step / totalSteps, 0), 1) : 0;

  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: totalSteps, now: step }}
    >
      <View
        style={[
          styles.fill,
          { width: `${ratio * 100}%`, backgroundColor: colors[color] },
        ]}
      />
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
    // RTL: progress grows from the right edge.
    alignSelf: 'flex-end',
  },
});
