import { ChevronRight } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, screenPadding, spacing } from '@/theme';

import { Text } from './Text';

export type BackHeaderProps = {
  onBack: () => void;
  /** G-01: a green header with a title; omitted keeps the plain chevron-only header. */
  title?: string;
};

const CHEVRON_SIZE = 24;
// The same 110 bar AppHeader draws, since this is that bar with a different leading control.
const GREEN_HEIGHT = 110;
const GREEN_ROW_HEIGHT = 46;
const GREEN_PAD_BOTTOM = spacing[12];
const GREEN_PAD_TOP = GREEN_HEIGHT - GREEN_ROW_HEIGHT - GREEN_PAD_BOTTOM;

/** The chevron points right because the layout is RTL. WizardHeader is the wizard's. */
export function BackHeader({ onBack, title }: BackHeaderProps) {
  const insets = useSafeAreaInsets();

  if (title) {
    return (
      <View
        style={[
          styles.green,
          { paddingTop: Math.max(GREEN_PAD_TOP, insets.top + spacing[4]) },
        ]}
      >
        <View style={styles.greenRow}>
          <TouchableOpacity
            onPress={onBack}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel="رجوع"
          >
            <ChevronRight size={CHEVRON_SIZE} color={colors.textInverse} />
          </TouchableOpacity>

          <Text variant="h3" color="textInverse" align="right" style={styles.greenTitle}>
            {title}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={onBack}
        hitSlop={hitSlop}
        accessibilityRole="button"
        accessibilityLabel="رجوع"
      >
        <ChevronRight size={CHEVRON_SIZE} color={colors.textStrong} />
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
  green: {
    backgroundColor: colors.primary,
    paddingHorizontal: screenPadding,
    paddingBottom: GREEN_PAD_BOTTOM,
  },
  greenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[24],
    height: GREEN_ROW_HEIGHT,
  },
  greenTitle: {
    flex: 1,
  },
});
