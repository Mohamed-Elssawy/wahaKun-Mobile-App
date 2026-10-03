import { Check } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

/** §8.3's 4-node stepper. A view of canonical nodes 3-6, not a second state machine - the
 * screen that owns a step passes its own 1-4 position, never a `LifecycleNode`. */
export type ExpertStepNode = 1 | 2 | 3 | 4;

export type ExpertStepperProps = {
  current: ExpertStepNode;
};

const LABELS: readonly string[] = ['مراجعة', 'الجدولة', 'تأكيد الحل', 'تأكيد المزارع'];

const DOT_SIZE = 28;
const CHECK_SIZE = 16;
const RAIL_HEIGHT = 2;

/** Right to left, mirroring `ReportStatusTrack`'s dot-rail layout with a third, "current"
 * state the farmer's 3-node track never needed. */
export function ExpertStepper({ current }: ExpertStepperProps) {
  return (
    <View style={styles.track} accessibilityRole="progressbar">
      {LABELS.map((label, index) => {
        const node = (index + 1) as ExpertStepNode;
        const isDone = node < current;
        const isCurrent = node === current;

        return (
          <View key={label} style={styles.step}>
            <View style={styles.dotRow}>
              <View
                style={[
                  styles.rail,
                  isDone && styles.railDone,
                  index === 0 && styles.railHidden,
                ]}
              />
              <View
                style={[
                  styles.dot,
                  isDone && styles.dotDone,
                  isCurrent && styles.dotCurrent,
                ]}
              >
                {isDone ? <Check size={CHECK_SIZE} color={colors.textInverse} /> : null}
              </View>
              <View
                style={[
                  styles.rail,
                  node < current - 1 && styles.railDone,
                  index === LABELS.length - 1 && styles.railHidden,
                ]}
              />
            </View>

            <Text
              variant="label12"
              color={isCurrent ? 'primary' : isDone ? 'textPrimary' : 'textSecondary'}
              align="center"
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
  },
  step: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[8],
  },
  dotRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  rail: {
    flex: 1,
    height: RAIL_HEIGHT,
    backgroundColor: colors.borderStrong,
  },
  railDone: {
    backgroundColor: colors.primary,
  },
  railHidden: {
    backgroundColor: 'transparent',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: radii.pill,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dotCurrent: {
    borderColor: colors.primary,
  },
});
