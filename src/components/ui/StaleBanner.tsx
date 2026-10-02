import { CloudOff } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { colors, screenPadding, spacing } from '@/theme';

import { Text } from './Text';

export type StaleBannerProps = {
  /** Why what is on screen may be out of date. Arabic, from the surface that is stale. */
  message: string;
  /**
   * G-NO-PTR rules out pull-to-refresh everywhere, so this banner is the only place a manual
   * refresh can live. Omit it and the farmer's only way to refresh is to leave and come back.
   */
  onRetry?: () => void;
};

const ICON_SIZE = 18;
const RETRY = 'تحديث';

/**
 * D-STALE: cached content is on screen because the network is not. Green, because
 * SYSTEM-SPEC §6.4 makes green the tint for what the system did, not for a failure.
 */
// Marked NOT DESIGNED in §6.6. This is the shape, drawn from the offline notice on X-09;
// U15 settles the measurements against the frame.
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
