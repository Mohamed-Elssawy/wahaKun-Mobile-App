import { Check } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { t } from '@/i18n';
import type { TranslationKey } from '@/i18n';
import { colors, radii, spacing } from '@/theme';

/** A view of canonical nodes 3-6, not a second state machine; 5 is E-06's closed state. */
export type ExpertStepNode = 1 | 2 | 3 | 4 | 5;

export type ExpertStepperProps = {
  current: ExpertStepNode;
};

/** Node 1 reuses `f07.tab.review` rather than minting an `e02.*` twin: it's the same Arabic string as F-07/E-01, and a twin would double-maintain one English behind it. */
const LABEL_KEYS: readonly TranslationKey[] = [
  'f07.tab.review',
  'expert.step.schedule',
  'expert.step.confirmRepair',
  'expert.step.farmerConfirm',
];

const DOT_SIZE = 42;
const CHECK_SIZE = 24;
const RAIL_HEIGHT = 2;
/** Measured on E-05: a 42dp ring, 2dp stroke, and a solid disc of this across the middle. */
const CURRENT_DOT_SIZE = 22;

/** Right to left, mirroring ReportStatusTrack with a third current state it never needed. */
export function ExpertStepper({ current }: ExpertStepperProps) {
  return (
    <View style={styles.track} accessibilityRole="progressbar">
      {LABEL_KEYS.map((labelKey, index) => {
        const node = (index + 1) as ExpertStepNode;
        const isDone = node < current;
        const isCurrent = node === current;
        const label = t(labelKey);

        return (
          <View key={labelKey} style={styles.step}>
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
                {/* C70: the current node is a ring around a filled centre, not a bare ring. */}
                {isCurrent ? <View style={styles.dotCurrentCore} /> : null}
              </View>
              <View
                style={[
                  styles.rail,
                  node < current - 1 && styles.railDone,
                  index === LABEL_KEYS.length - 1 && styles.railHidden,
                ]}
              />
            </View>

            {/* Reached nodes, done or current, are green; only nodes still ahead are grey. */}
            <Text
              variant="label12"
              color={node <= current ? 'primary' : 'textSecondary'}
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
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  step: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[8],
  },
  dotRow: {
    flexDirection: 'row',
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
  dotCurrentCore: {
    width: CURRENT_DOT_SIZE,
    height: CURRENT_DOT_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
});
