import { Check } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

import { factsFromWireStatus, stageFor } from '../lifecycle';

import type { ReportStatus } from '../types';

export type ReportStatusTrackProps = {
  status: ReportStatus;
};

const DOT_SIZE = 32;
const CHECK_SIZE = 18;
const RAIL_HEIGHT = 2;

type Step = { label: string; isDone: boolean };

/** F-04 draws three fixed steps; §3.3's six nodes collapse onto them. */
function stepsFor(status: ReportStatus): Step[] {
  const stage = stageFor(factsFromWireStatus(status));

  return [
    // The row exists, so this one is true the moment there is anything to render.
    { label: 'تم الإبلاغ', isDone: true },
    { label: 'قيد الحل', isDone: stage === 'inProgress' || stage === 'resolved' },
    { label: 'تم الحل', isDone: stage === 'resolved' },
  ];
}

export function ReportStatusTrack({ status }: ReportStatusTrackProps) {
  const steps = stepsFor(status);

  return (
    // row-reverse: the first step sits at the right, where the reading starts.
    <View style={styles.track} accessibilityRole="progressbar">
      {steps.map((step, index) => (
        <View key={step.label} style={styles.step}>
          <View style={styles.dotRow}>
            {/* Rails are siblings of the dot, so a wrapped label cannot drag the line askew. */}
            <View
              style={[
                styles.rail,
                step.isDone && styles.railDone,
                index === 0 && styles.railHidden,
              ]}
            />
            <View style={[styles.dot, step.isDone && styles.dotDone]}>
              {step.isDone ? (
                <Check size={CHECK_SIZE} color={colors.textInverse} />
              ) : null}
            </View>
            <View
              style={[
                styles.rail,
                steps[index + 1]?.isDone && styles.railDone,
                index === steps.length - 1 && styles.railHidden,
              ]}
            />
          </View>

          <Text
            variant="label12"
            color={step.isDone ? 'textPrimary' : 'textSecondary'}
            align="center"
          >
            {step.label}
          </Text>
        </View>
      ))}
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
  // Keeps the dot centred at the ends by holding the space without painting it.
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
});
