import { StyleSheet, View } from 'react-native';

import { FilterChip, Text } from '@/components/ui';
import { spacing } from '@/theme';

import { SCHEDULE_SLOTS } from '../types';

import type { ScheduleSlot } from '../types';

export type ScheduleSlotsProps = {
  label: string;
  value: ScheduleSlot | null;
  onChange: (slot: ScheduleSlot) => void;
};

/** §8.3's six fixed E-03 slots. Availability is never modelled - every slot is always offered. */
export function ScheduleSlots({ label, value, onChange }: ScheduleSlotsProps) {
  return (
    <View style={styles.section}>
      <Text variant="label14" color="textSecondary" align="right">
        {label}
      </Text>

      <View style={styles.grid}>
        {SCHEDULE_SLOTS.map(slot => (
          <FilterChip key={slot} label={slot} isActive={value === slot} onPress={() => onChange(slot)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing[8],
  },
  grid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing[8],
  },
});
