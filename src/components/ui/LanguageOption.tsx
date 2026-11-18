import { StyleSheet, TouchableOpacity } from 'react-native';

import { colors, radii, spacing } from '@/theme';

import { Text } from './Text';

export type LanguageOptionProps = {
  /** Always in its own script, in both locales: `العربية` or `English`. §16.4. */
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
};

// One card in S-12's dialog. Sibling of onboarding's ActionCard, not a copy - shares S-05.2's selection tokens, but ActionCard needs an icon/subtitle/100pt min this doesn't.
export function LanguageOption({
  label,
  selected,
  onPress,
  disabled = false,
}: LanguageOptionProps) {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
    >
      <Text variant="h3" align="center" color={selected ? 'primaryStrong' : 'textStrong'}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // C30: 16 gives 74dp against the frame's 78dp; the exact value needs an off-ramp step, so this is flagged, not hardcoded.
  card: {
    paddingVertical: spacing[16],
    paddingHorizontal: spacing[24],
    borderWidth: 1,
    borderColor: colors.borderCard,
    borderRadius: radii[16],
    backgroundColor: colors.surface,
  },
  cardSelected: {
    borderColor: colors.primaryStrong,
    backgroundColor: colors.primaryTint,
  },
});
