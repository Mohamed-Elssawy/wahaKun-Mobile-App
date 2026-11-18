import { StyleSheet, View } from 'react-native';

import { FilterChip, Text, TextField } from '@/components/ui';
import { t } from '@/i18n';
import { spacing } from '@/theme';

import { OTHER_REASON, RESCHEDULE_REASON_CHIPS, reasonLabel } from '../types';

import type { RescheduleReasonChip } from '../types';

export type ScheduleReasonChipsProps = {
  value: RescheduleReasonChip | null;
  onChange: (chip: RescheduleReasonChip) => void;
  note: string;
  onNoteChange: (note: string) => void;
};

/** Reschedule only, since the farmer's node-4 chip renders it; `other` takes the free text. */
export function ScheduleReasonChips({
  value,
  onChange,
  note,
  onNoteChange,
}: ScheduleReasonChipsProps) {
  return (
    <View style={styles.section}>
      <Text variant="h5" color="textSecondary">
        {t('e03.reasonLabel')}
      </Text>

      <View style={styles.grid}>
        {RESCHEDULE_REASON_CHIPS.map(chip => (
          <FilterChip
            key={chip}
            label={reasonLabel(chip)}
            isActive={value === chip}
            onPress={() => onChange(chip)}
          />
        ))}
      </View>

      {value === OTHER_REASON ? (
        <TextField
          placeholder={t('e03.reasonPlaceholder')}
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[8],
  },
  noteInput: {},
});
