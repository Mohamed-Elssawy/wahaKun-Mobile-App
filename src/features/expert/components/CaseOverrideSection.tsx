import { StyleSheet, Switch, View } from 'react-native';

import { FilterChip, TextField, Text } from '@/components/ui';
import { describeSeverity } from '@/features/reports/severity';
import type { Severity } from '@/features/reports/types';
import { colors, radii, spacing } from '@/theme';

export type CaseOverrideSectionProps = {
  isOn: boolean;
  onToggle: (next: boolean) => void;
  severity?: Severity;
  onChangeSeverity: (severity: Severity) => void;
  correctedDiagnosis: string;
  onChangeCorrectedDiagnosis: (text: string) => void;
};

const TOGGLE_TITLE = 'تجاوز تشخيص الذكاء الاصطناعي';
const TOGGLE_SUBTITLE = 'فعّل إذا كان تقييمك مختلف';
const SEVERITY_LABEL = 'مستوى الخطورة';
const DIAGNOSIS_LABEL = 'التشخيص المصحّح';
const DIAGNOSIS_PLACEHOLDER = 'اكتب تشخيصك هنا...';

/** §8.3's `C-OVERRIDE`. Both conditional fields render only while `isOn`; the diagnosis
 * textarea is the one the caller must block submit on when it is empty. */
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
          <Text variant="h5" align="right">
            {TOGGLE_TITLE}
          </Text>
          <Text variant="label14" color="textSecondary" align="right">
            {TOGGLE_SUBTITLE}
          </Text>
        </View>

        <Switch
          value={isOn}
          onValueChange={onToggle}
          trackColor={{ false: colors.borderControl, true: colors.primary }}
          thumbColor={colors.surface}
        />
      </View>

      {isOn ? (
        <View style={styles.fields}>
          <View style={styles.severityField}>
            <Text variant="label14" color="textSecondary" align="right">
              {SEVERITY_LABEL}
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
            label={DIAGNOSIS_LABEL}
            placeholder={DIAGNOSIS_PLACEHOLDER}
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
    flexDirection: 'row-reverse',
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
    flexDirection: 'row-reverse',
    gap: spacing[8],
  },
  multilineInput: {
    textAlign: 'right',
    minHeight: 72,
    textAlignVertical: 'top',
  },
});
