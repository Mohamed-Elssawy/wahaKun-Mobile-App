import { StyleSheet, TextInput, View } from 'react-native';

import type { Country } from '@/constants/countries';
import { t } from '@/i18n';
import { colors, controlHeight, radii, spacing, textStyles } from '@/theme';

import { Text } from './Text';

export type PhoneFieldProps = {
  label?: string;
  country: Country;
  value: string;
  onChangeText: (digits: string) => void;
  error?: string;
};

// C4: prefix is a label, not a control - SPEC 8 S-03 locks the country to Egypt, so no chevron/flag/picker; country stays a prop since this file is chrome.
export function PhoneField({
  label,
  country,
  value,
  onChangeText,
  error,
}: PhoneFieldProps) {
  const hasError = Boolean(error);

  return (
    <View style={styles.group}>
      {label ? <Text variant="label14">{label}</Text> : null}

      <View style={[styles.row, hasError && styles.rowError]}>
        {/* "+ 20", the way the frame and SPEC 8 S-03 both write it: the sign, then the code. */}
        <Text variant="label16Bold" style={styles.dialCode}>
          {`${country.dialCode.slice(0, 1)} ${country.dialCode.slice(1)}`}
        </Text>

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={text => onChangeText(text.replace(/[^0-9]/g, ''))}
          placeholderTextColor={colors.textPlaceholder}
          keyboardType="phone-pad"
          textAlign="left"
          accessibilityLabel={t('common.phoneNumber')}
        />
      </View>

      {hasError ? (
        <Text variant="label14Bold" color="errorText">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { width: '100%', gap: spacing[8] },
  // S-03: prefix then number, left to right in both locales (SPEC 6.7), so this pins its own direction.
  row: {
    direction: 'ltr',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    width: '100%',
    minHeight: controlHeight,
    borderWidth: 1,
    borderColor: colors.borderControl,
    borderRadius: radii[6],
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[16],
  },
  rowError: { borderColor: colors.error },
  dialCode: { writingDirection: 'ltr' },
  input: {
    flex: 1,
    ...textStyles.label16,
    color: colors.textPrimary,
    padding: 0,
  },
});
