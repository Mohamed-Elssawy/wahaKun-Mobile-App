import { useRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { colors, radii, spacing, textStyles } from '@/theme';

import type { NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';

export type OtpInputProps = {
  value: string;
  onChange: (code: string) => void;
  length?: number;
  autoFocus?: boolean;
};

/**
 * Fixed-length numeric code entry with auto-advance, backspace-to-previous and
 * paste handling. Shared by the registration and login OTP steps.
 */
export function OtpInput({
  value,
  onChange,
  length = 6,
  autoFocus = true,
}: OtpInputProps) {
  const inputs = useRef<Array<TextInput | null>>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  const setDigit = (raw: string, index: number) => {
    const cleaned = raw.replace(/[^0-9]/g, '');

    if (cleaned.length > 1) {
      // Pasted code — fill from the start and focus the end of what landed.
      const pasted = cleaned.slice(0, length);
      onChange(pasted);
      inputs.current[Math.min(pasted.length, length - 1)]?.focus();
      return;
    }

    const next = [...digits];
    next[index] = cleaned;
    onChange(next.join('').replace(/\s/g, ''));

    if (cleaned && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    event: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (event.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.row}>
      {digits.map((digit, index) => (
        <TextInput
          // Position is the identity here — the boxes never reorder.
          key={index}
          ref={ref => {
            inputs.current[index] = ref;
          }}
          style={[styles.box, digit ? styles.boxFilled : null]}
          value={digit}
          onChangeText={text => setDigit(text, index)}
          onKeyPress={event => handleKeyPress(event, index)}
          keyboardType="number-pad"
          maxLength={length}
          textAlign="center"
          autoFocus={autoFocus && index === 0}
          accessibilityLabel={`رقم ${index + 1} من ${length}`}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    gap: spacing.sm,
    width: '100%',
  },
  box: {
    flex: 1,
    height: 56,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    ...textStyles.label20Bold,
    color: colors.textPrimary,
    padding: 0,
  },
  boxFilled: {
    borderColor: colors.primary,
  },
});
