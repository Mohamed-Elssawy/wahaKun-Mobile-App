import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, shadows, spacing } from '@/theme';

import type { LucideIcon } from 'lucide-react-native';

export type MapNoticeProps = {
  /** Omitted draws a spinner instead, which is the loading form of the same card. */
  icon?: LucideIcon;
  title?: string;
  message?: string;
};

const CIRCLE_SIZE = 64;
const ICON_SIZE = 28;

/** The map's loading and empty states. ReportsEmptyState fills a screen, so it stretches over a map. */
export function MapNotice({ icon: Icon, title, message }: MapNoticeProps) {
  return (
    <View style={styles.card}>
      {Icon ? (
        <View style={styles.circle}>
          <Icon size={ICON_SIZE} color={colors.primary} />
        </View>
      ) : (
        <ActivityIndicator color={colors.primary} />
      )}

      {title ? (
        <Text variant="h5" align="center">
          {title}
        </Text>
      ) : null}

      {message ? (
        <Text variant="label14" color="textSecondary" align="center">
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // Hugs its content: it floats over imagery, so it may not take the height it is offered.
  card: {
    alignSelf: 'center',
    alignItems: 'center',
    gap: spacing[8],
    maxWidth: 280,
    paddingHorizontal: spacing[24],
    paddingVertical: spacing[16],
    borderRadius: radii[16],
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
