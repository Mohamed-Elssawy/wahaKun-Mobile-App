import { ChevronDown } from 'lucide-react-native';
import { useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { COUNTRIES } from '@/constants/countries';
import type { Country } from '@/constants/countries';
import { colors, controlHeight, radii, spacing, textStyles } from '@/theme';

import { Text } from './Text';

export type PhoneFieldProps = {
  label?: string;
  country: Country;
  onCountryChange: (country: Country) => void;
  value: string;
  onChangeText: (digits: string) => void;
  error?: string;
};

/** Country selector + national number, with the picker modal. */
export function PhoneField({
  label,
  country,
  onCountryChange,
  value,
  onChangeText,
  error,
}: PhoneFieldProps) {
  const [isPickerVisible, setPickerVisible] = useState(false);
  const hasError = Boolean(error);

  const selectCountry = (next: Country) => {
    onCountryChange(next);
    setPickerVisible(false);
  };

  return (
    <View style={styles.group}>
      {label ? (
        <Text variant="label14" align="right">
          {label}
        </Text>
      ) : null}

      <View style={[styles.row, hasError && styles.rowError]}>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setPickerVisible(true)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`رمز الدولة ${country.dialCode}`}
        >
          <ChevronDown size={16} color={colors.textSecondary} />
          <Text variant="label16Bold">{country.dialCode}</Text>
          <Text style={styles.flag}>{country.flag}</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TextInput
          style={styles.input}
          value={value}
          onChangeText={text => onChangeText(text.replace(/[^0-9]/g, ''))}
          placeholderTextColor={colors.textPlaceholder}
          keyboardType="phone-pad"
          textAlign="left"
          accessibilityLabel="رقم الهاتف"
        />
      </View>

      {hasError ? (
        <Text variant="label14Bold" color="error" align="right">
          {error}
        </Text>
      ) : null}

      <Modal
        visible={isPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setPickerVisible(false)}
        >
          <View style={styles.sheet}>
            <Text variant="h4" align="center" style={styles.sheetTitle}>
              اختر الدولة
            </Text>
            <FlatList
              data={COUNTRIES}
              keyExtractor={item => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.item, country.code === item.code && styles.itemSelected]}
                  onPress={() => selectCountry(item)}
                >
                  <Text variant="label14" color="textSecondary">
                    {item.dialCode}
                  </Text>
                  <View style={styles.itemName}>
                    <Text variant="label16">{item.name}</Text>
                    <Text style={styles.flag}>{item.flag}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { width: '100%', gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: controlHeight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
  },
  rowError: { borderColor: colors.error },
  selector: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
  },
  flag: { fontSize: 18 },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    ...textStyles.label16,
    color: colors.textPrimary,
    padding: 0,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.md,
    borderTopRightRadius: radii.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '60%',
  },
  sheetTitle: { marginBottom: spacing.md },
  item: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  itemSelected: { backgroundColor: colors.background },
  itemName: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.ms,
  },
});
