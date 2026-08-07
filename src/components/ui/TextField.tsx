import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { colors, controlHeight, radii, spacing, textStyles } from '@/theme';

import { Text } from './Text';

import type { StyleProp, TextInputProps, ViewStyle } from 'react-native';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label?: string;
  /** Renders below the field and puts the border in the error colour. */
  error?: string;
  /** Adds a show/hide toggle and masks input by default. */
  secure?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

export function TextField({
  label,
  error,
  secure = false,
  containerStyle,
  ...inputProps
}: TextFieldProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const hasError = Boolean(error);

  return (
    <View style={[styles.group, containerStyle]}>
      {label ? (
        <Text variant="label14" color="textPrimary" align="right">
          {label}
        </Text>
      ) : null}

      <View style={[styles.box, hasError && styles.boxError]}>
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.textPlaceholder}
          secureTextEntry={secure && !isRevealed}
          {...inputProps}
        />

        {secure ? (
          <TouchableOpacity
            onPress={() => setIsRevealed(current => !current)}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel={isRevealed ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          >
            {isRevealed ? (
              <EyeOff size={20} color={colors.textSecondary} />
            ) : (
              <Eye size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        ) : null}
      </View>

      {hasError ? (
        <Text variant="label14Bold" color="errorText" align="right">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

const styles = StyleSheet.create({
  group: {
    width: '100%',
    gap: spacing[8],
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[10],
    width: '100%',
    minHeight: controlHeight,
    borderWidth: 1,
    borderColor: colors.borderControl,
    borderRadius: radii[6],
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[16],
  },
  boxError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    ...textStyles.label16,
    color: colors.textPrimary,
    // Email, phone and password read left to right even on an RTL screen.
    textAlign: 'left',
    padding: 0,
  },
});
