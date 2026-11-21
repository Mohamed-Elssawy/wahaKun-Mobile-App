import { StyleSheet, View } from 'react-native';

import { FilterChip, Switch, TextField, Text } from '@/components/ui';
import { describeSeverity } from '@/features/reports/severity';
import type { Severity } from '@/features/reports/types';
import { t } from '@/i18n';
import { colors, radii, spacing } from '@/theme';

export type CaseOverrideSectionProps = {
  isOn: boolean;
  onToggle: (next: boolean) => void;
  severity?: Severity;
  onChangeSeverity: (severity: Severity) => void;
  correctedDiagnosis: string;
  onChangeCorrectedDiagnosis: (text: string) => void;
};

/** Both fields render only while isOn; the caller blocks submit on an empty diagnosis. */
const SEVERITY_OPTIONS: readonly Severity[] = ['Critical', 'Medium', 'Low'];

export function CaseOverrideSection({
  isOn,
  onToggle,
  severity,
  onChangeSeverity,
  correctedDiagnosis,
  onChangeCorrectedDiagnosis,
}: CaseOverrideSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.toggleCard}>
        <View style={styles.toggleText}>
          <Text variant="h5">{t('expert.overrideTitle')}</Text>
          <Text variant="label14" color="textSecondary">
            {t('expert.overrideHint')}
          </Text>
        </View>

        <Switch
          checked={isOn}
          onChange={onToggle}
          accessibilityLabel={t('expert.overrideTitle')}
        />
      </View>

      {isOn ? (
        <View style={styles.fields}>
          <View style={styles.severityField}>
            <Text variant="label14" color="textSecondary">
              {t('f05.legendTitle')}
            </Text>

            <View style={styles.severityOptions}>
              {SEVERITY_OPTIONS.map(option => {
                const display = describeSeverity(option);
                return (
                  <FilterChip
                    key={option}
                    label={display.label}
                    isActive={severity === option}
                    onPress={() => onChangeSeverity(option)}
                  />
                );
              })}
            </View>
          </View>

          <TextField
            label={t('expert.correctedDiagnosis')}
            placeholder={t('expert.correctedPlaceholder')}
            value={correctedDiagnosis}
            onChangeText={onChangeCorrectedDiagnosis}
            multiline
            numberOfLines={3}
            inputStyle={styles.multilineInput}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing[16],
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[12],
    backgroundColor: colors.surface,
    borderRadius: radii[16],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[16],
  },
  toggleText: {
    flex: 1,
    gap: spacing[4],
  },
  fields: {
    gap: spacing[16],
  },
  severityField: {
    gap: spacing[8],
  },
  severityOptions: {
    flexDirection: 'row',
    gap: spacing[8],
  },
  multilineInput: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
});
