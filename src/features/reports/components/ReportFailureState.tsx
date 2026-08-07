import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { colors, radii, screenPadding, spacing } from '@/theme';

import type { LucideIcon } from 'lucide-react-native';

export type ReportFailureStateProps = {
  icon: LucideIcon;
  title: string;
  message: string;
  action?: { label: string; onPress: () => void };
};

const CIRCLE_SIZE = 100;
const ICON_SIZE = 44;

/** X-05, X-01 and the camera wall are one drawing with a different glyph and copy. */
// errorStrong, not error: R500 has too little contrast on its own tint at 44dp.
export function ReportFailureState({
  icon: Icon,
  title,
  message,
  action,
}: ReportFailureStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.group}>
        <View style={styles.circle}>
          <Icon size={ICON_SIZE} color={colors.errorText} />
        </View>

        <View style={styles.text}>
          <Text variant="h4" align="center">
            {title}
          </Text>
          <Text variant="label14" color="textMuted" align="center">
            {message}
          </Text>
        </View>
      </View>

      {action ? <Button label={action.label} onPress={action.onPress} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: screenPadding,
    paddingBottom: spacing[32],
  },
  // Absorbs the leftover height, which is what holds the button at the bottom.
  group: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // Figma's 21dp is glyph edge to glyph edge; h4's line box already adds a few.
    gap: spacing[16],
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.errorTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    alignItems: 'center',
    gap: spacing[4],
  },
});
