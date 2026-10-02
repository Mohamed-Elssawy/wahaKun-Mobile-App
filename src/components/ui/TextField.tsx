import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { colors, controlHeight, radii, spacing, textStyles } from '@/theme';

import { InlineFieldError } from './InlineFieldError';
import { Text } from './Text';

import type { StyleProp, TextInputProps, TextStyle, ViewStyle } from 'react-native';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label?: string;
  /** Renders below the field and puts the border in the error colour. */
  error?: string;
  /** Adds a show/hide toggle and masks input by default. */
  secure?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  /** Mainly `textAlign: 'right'`: the default is left, which suits email and phone. */
  inputStyle?: StyleProp<TextStyle>;
};

export function TextField({
  label,
  error,
  secure = false,
  containerStyle,
  inputStyle,
  ...inputProps
}: TextFieldProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const hasError = Boolean(error);

  return (
    <View style={[styles.group, containerStyle]}>
      {label ? (
        <Text variant="label14" color="textSecondary" align="right">
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.box,
          // A multiline box grows, so the caret and reveal control belong at the top.
          inputProps.multiline && styles.boxMultiline,
          hasError && styles.boxError,
        ]}
      >
        <TextInput
          style={[styles.input, inputStyle]}
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
              <EyeOff size={20} color={colors.textMuted} />
            ) : (
              <Eye size={20} color={colors.textMuted} />
            )}
          </TouchableOpacity>
        ) : null}
      </View>

      {hasError && error ? <InlineFieldError message={error} /> : null}
    </View>
  );
}

const hitSlop = { top: 10, bottom: 10, left: 10, right: 10 };

const styles = StyleSheet.create({
  group: {
    width: '100%',
    gap: spacing[4],
  },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[10],
    width: '100%',
    minHeight: controlHeight,
    borderWidth: 1,
    // borderControl (not borderStrong): the box outline is what marks this as a control (WCAG 1.4.11).
    borderColor: colors.borderControl,
    borderRadius: radii[6],
    backgroundColor: colors.surface,
    paddingHorizontal: spacing[12],
  },
  boxMultiline: {
    alignItems: 'flex-start',
    paddingVertical: spacing[12],
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
