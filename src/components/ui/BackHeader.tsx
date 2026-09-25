import { ChevronRight } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { colors, screenPadding, spacing } from '@/theme';

export type BackHeaderProps = {
  onBack: () => void;
};

/** The chevron points right because the layout is RTL. WizardHeader is the wizard's. */
export function BackHeader({ onBack }: BackHeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={onBack}
        hitSlop={hitSlop}
        accessibilityRole="button"
        accessibilityLabel="رجوع"
      >
        <ChevronRight size={24} color={colors.textStrong} />
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
    paddingTop: spacing[56],
    paddingBottom: spacing[12],
  },
});
