import { Bell, ChevronDown, MapPin, User } from 'lucide-react-native';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { t } from '@/i18n';
import { colors, radii, spacing } from '@/theme';

import { Text } from './Text';

export type AppHeaderProps = {
  title: string;
  /** The signed-in farmer's photo. A placeholder shows until UserService answers. */
  avatarUrl?: string;
  /** Region line under the bar, e.g. "واحة سيوة، شمال". Hidden when unknown. */
  location?: string;
  onOpenProfile: () => void;
  /** Omitted, the bell renders inert - every call site now passes it (P10). */
  onOpenNotifications?: () => void;
};

const AVATAR_SIZE = 24;
const ICON_SIZE = 24;
const PIN_SIZE = 16;

// F-05, F-07 and S-07 draw a 110 bar: 52, a 46 row, then 12. The 52 is a floor; a taller status bar wins.
const HEIGHT = 110;
const ROW_HEIGHT = 46;
const PAD_BOTTOM = spacing[12];
const PAD_TOP = HEIGHT - ROW_HEIGHT - PAD_BOTTOM;

/** The green bar F-01, F-05 and S-07 share: avatar and bell leading, title trailing. */
export function AppHeader({
  title,
  avatarUrl,
  location,
  onOpenProfile,
  onOpenNotifications,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <>
      <View
        style={[styles.bar, { paddingTop: Math.max(PAD_TOP, insets.top + spacing[4]) }]}
      >
        <View style={styles.row}>
          <Text variant="h3" color="textInverse" style={styles.title}>
            {title}
          </Text>

          <View style={styles.controls}>
            <TouchableOpacity
              onPress={onOpenNotifications ?? (() => {})}
              accessibilityRole="button"
              accessibilityLabel={t('common.notifications')}
            >
              <Bell size={ICON_SIZE} color={colors.textInverse} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onOpenProfile}
              accessibilityRole="button"
              accessibilityLabel={t('common.profile')}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarEmpty]}>
                  <User size={PIN_SIZE} color={colors.textInverse} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {location ? (
        <View style={styles.locationRow}>
          <ChevronDown size={PIN_SIZE} color={colors.textSecondary} />
          <Text variant="label14" color="textSecondary">
            {location}
          </Text>
          <MapPin size={PIN_SIZE} color={colors.primary} />
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing[24],
    paddingBottom: PAD_BOTTOM,
  },
  // Title first, so it takes the start edge and the controls the far one.
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // Fixed, so the bar is 110 whatever the title's line height happens to be.
    height: ROW_HEIGHT,
  },
  // §8.2 reads bell then avatar from the start, so the avatar lands on the outer edge.
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[24],
  },
  // Takes the rest of the bar so the title ends at the 24pt margin.
  title: {
    flex: 1,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.textInverse,
  },
  avatarEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: spacing[4],
    paddingHorizontal: spacing[24],
    paddingVertical: spacing[12],
  },
});
