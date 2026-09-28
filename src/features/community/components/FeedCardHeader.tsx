import { Clock, MapPin, User } from 'lucide-react-native';
import { Image, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { describeTierDisplay } from '@/features/map/tier';
import type { MapIssueTier } from '@/features/map/types';
import { formatRelativeTime } from '@/features/reports/relativeTime';
import { colors, radii, spacing } from '@/theme';

import { TierBadge } from './TierBadge';

import type { FeedPost } from '../types';

export type FeedCardHeaderProps = {
  post: FeedPost;
  /** Already formatted, because only the screen knows where the farmer is. */
  distanceLabel?: string;
};

const AVATAR_SIZE = 42;
const META_ICON_SIZE = 14;

const UNKNOWN_AUTHOR = 'مزارع من الواحة';

/** A resolved issue has no severity left to report, and the frame drops its badge. */
function badgeTier(tier: MapIssueTier): MapIssueTier | null {
  return tier === 'resolved' ? null : tier;
}

/** The avatar, author and meta row at the top of a feed card, with the severity badge opposite. */
export function FeedCardHeader({ post, distanceLabel }: FeedCardHeaderProps) {
  const tier = badgeTier(post.tier);

  return (
    <View style={styles.row}>
      {post.reporterPicture ? (
        <Image source={{ uri: post.reporterPicture }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarEmpty]}>
          <User size={AVATAR_SIZE / 2} color={colors.textMuted} />
        </View>
      )}

      <View style={styles.identity}>
        <Text variant="label16Bold" align="right" numberOfLines={1}>
          {post.reporterName || UNKNOWN_AUTHOR}
        </Text>

        <View style={styles.meta}>
          <Clock size={META_ICON_SIZE} color={colors.textMuted} />
          <Text variant="label12" color="textMuted">
            {formatRelativeTime(post.createdAt)}
          </Text>

          {/* Hidden rather than zeroed: an issue with no fix must not read "0 كم". */}
          {distanceLabel ? (
            <>
              <MapPin size={META_ICON_SIZE} color={colors.textMuted} />
              <Text variant="label12" color="textMuted">
                {distanceLabel}
              </Text>
            </>
          ) : null}
        </View>
      </View>

      {tier ? <TierBadge tier={tier} label={describeTierDisplay(tier).shortLabel} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[12],
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radii.pill,
  },
  avatarEmpty: {
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Takes the slack so the badge stays pinned to the leading edge whatever the name's length.
  identity: {
    flex: 1,
    alignItems: 'flex-end',
    gap: spacing[2],
  },
  meta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[4],
  },
});
