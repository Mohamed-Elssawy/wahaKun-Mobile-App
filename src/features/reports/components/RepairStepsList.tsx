import { StyleSheet, View } from 'react-native';

import { BiText, Text } from '@/components/ui';
import { detectDirection, direction as uiDirection } from '@/i18n';
import { colors, radii, spacing } from '@/theme';

export type RepairStepsListProps = {
  steps: string[];
};

const NUMBER_SIZE = 28;

/** Numbered, not ticked: these are instructions in order, and a tick would claim done. */
export function RepairStepsList({ steps }: RepairStepsListProps) {
  return (
    <View style={styles.list}>
      {steps.map((step, index) => {
        // E9: the row takes the step's own direction so a mixed-locale list puts each number correctly.
        const rowDirection = detectDirection(step) ?? uiDirection();

        return (
          // No ids and repeatable text, so index is the only key. Never reordered.
          <View key={index} style={[styles.step, { direction: rowDirection }]}>
            <View style={styles.number}>
              <Text variant="label14Bold" color="textInverse">
                {index + 1}
              </Text>
            </View>

            {/* label14, not body14: body leading opened visible gaps between one-line steps. */}
            <BiText
              contentRole="body"
              resolvedDirection={rowDirection}
              variant="label14"
              style={styles.text}
            >
              {step}
            </BiText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing[12],
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[12],
  },
  // Filled green with an inverse numeral; G500 on G100 is 3.1:1 and fails AA here.
  number: {
    width: NUMBER_SIZE,
    height: NUMBER_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
  },
});
