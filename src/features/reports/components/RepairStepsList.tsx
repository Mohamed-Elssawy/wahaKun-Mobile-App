import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

export type RepairStepsListProps = {
  steps: string[];
};

const NUMBER_SIZE = 24;

/** Numbered, not ticked: these are instructions in order, and a tick would claim done. */
export function RepairStepsList({ steps }: RepairStepsListProps) {
  return (
    <View style={styles.list}>
      {steps.map((step, index) => (
        // No ids and repeatable text, so index is the only key. Never reordered.
        <View key={index} style={styles.step}>
          <View style={styles.number}>
            <Text variant="label12Bold" color="primary">
              {index + 1}
            </Text>
          </View>

          <Text variant="body14" align="right" style={styles.text}>
            {step}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing[12],
  },
  step: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: spacing[12],
  },
  number: {
    width: NUMBER_SIZE,
    height: NUMBER_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
  },
});
