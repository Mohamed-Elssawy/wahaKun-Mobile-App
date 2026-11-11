import { StyleSheet, View } from 'react-native';

import { FilterChip, Text, TextField } from '@/components/ui';
import { spacing } from '@/theme';

import { RESCHEDULE_REASON_CHIPS } from '../types';

import type { RescheduleReasonChip } from '../types';

export type ScheduleReasonChipsProps = {
  value: RescheduleReasonChip | null;
  onChange: (chip: RescheduleReasonChip) => void;
  note: string;
  onNoteChange: (note: string) => void;
};

const LABEL = 'سبب التغيير';
const OTHER: RescheduleReasonChip = 'أخرى';
const OTHER_PLACEHOLDER = 'اكتب السبب...';

/** Reschedule only, since the farmer's node-4 chip renders it; أخرى alone takes the free text. */
export function ScheduleReasonChips({
  value,
  onChange,
  note,
  onNoteChange,
}: ScheduleReasonChipsProps) {
  return (
    <View style={styles.section}>
      <Text variant="h5" color="textSecondary" align="right">
        {LABEL}
      </Text>

      <View style={styles.grid}>
        {RESCHEDULE_REASON_CHIPS.map(chip => (
          <FilterChip
            key={chip}
            label={chip}
            isActive={value === chip}
            onPress={() => onChange(chip)}
          />
        ))}
      </View>

      {value === OTHER ? (
        <TextField
          placeholder={OTHER_PLACEHOLDER}
          value={note}
          onChangeText={onNoteChange}
          inputStyle={styles.noteInput}
        />
      ) : null}
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
  noteInput: {
    textAlign: 'right',
  },
});
