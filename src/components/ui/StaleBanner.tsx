import { CloudOff } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { colors, screenPadding, spacing } from '@/theme';

import { Text } from './Text';

export type StaleBannerProps = {
  /** Why what is on screen may be out of date. Arabic, from the surface that is stale. */
  message: string;
  /** G-NO-PTR rules out pull-to-refresh, so omitting this leaves no way to refresh but leaving. */
  onRetry?: () => void;
};

const ICON_SIZE = 18;
const RETRY = 'تحديث';

/** D-STALE: cached content because the network is not there. Drawn from X-09's notice. */
export function StaleBanner({ message, onRetry }: StaleBannerProps) {
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <CloudOff size={ICON_SIZE} color={colors.primary} />

      <Text variant="label12" color="primaryPressed" align="right" style={styles.message}>
        {message}
      </Text>

      {onRetry ? (
        <TouchableOpacity
          onPress={onRetry}
          hitSlop={hitSlop}
          accessibilityRole="button"
          accessibilityLabel={RETRY}
        >
          <Text variant="label12Bold" color="primary">
            {RETRY}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const hitSlop = { top: 12, bottom: 12, left: 12, right: 12 };

const styles = StyleSheet.create({
  // Full bleed, not a card: it belongs to the list under it, not on top of it.
  banner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[8],
    paddingHorizontal: screenPadding,
    paddingVertical: spacing[8],
    backgroundColor: colors.primaryTint,
    borderBottomWidth: 1,
    borderBottomColor: colors.primaryMuted,
  },
  message: {
    flex: 1,
  },
});
