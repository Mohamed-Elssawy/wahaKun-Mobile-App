import { ArrowRight } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { colors, screenPadding, spacing } from '@/theme';

export type BackHeaderProps = {
  onBack: () => void;
};

/**
 * Plain back arrow for the login screens; WizardHeader is the equivalent for
 * the registration flow. The arrow points right because the layout is RTL.
 */
export function BackHeader({ onBack }: BackHeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={onBack}
        hitSlop={hitSlop}
        accessibilityRole="button"
        accessibilityLabel="رجوع"
      >
        <ArrowRight size={24} color={colors.textPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const hitSlop = { top: 12, bottom: 12, left: 12, right: 12 };

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    paddingHorizontal: screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
});
