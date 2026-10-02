import { StyleSheet, View } from 'react-native';

import { colors, radii, screenPadding, spacing } from '@/theme';

import { Button } from './Button';
import { Text } from './Text';

import type { LucideIcon } from 'lucide-react-native';

export type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  message: string;
  /** X-07 offers a way out; X-06 deliberately does not. */
  action?: { label: string; onPress: () => void };
};

const CIRCLE_SIZE = 100;
const ICON_SIZE = 44;

/**
 * SYSTEM-SPEC §5.5's one pattern: green-tinted circle and glyph, a headline naming what
 * is absent, a line saying what would fill it. X-06 and X-07 are this drawing twice;
 * only the call site tells them apart, because only one of them invites.
 */
export function EmptyState({ icon: Icon, title, message, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.group}>
        <View style={styles.circle}>
          <Icon size={ICON_SIZE} color={colors.primary} />
        </View>

        <View style={styles.text}>
          <Text variant="h4" align="center">
            {title}
          </Text>
          <Text variant="label14" color="textSecondary" align="center">
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
    gap: spacing[16],
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    alignItems: 'center',
    gap: spacing[4],
  },
});
