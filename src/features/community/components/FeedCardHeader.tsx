import { Clock, MapPin, User } from 'lucide-react-native';
import { Image, StyleSheet, View } from 'react-native';

import { SeverityBadge, Text } from '@/components/ui';
import { describeTierDisplay } from '@/features/map/tier';
import type { MapIssueTier } from '@/features/map/types';
import { formatRelativeTime } from '@/features/reports/relativeTime';
import { colors, radii, spacing } from '@/theme';

import { IssueMetaLine } from './IssueMetaLine';

import type { FeedPost } from '../types';

export type FeedCardHeaderProps = {
  post: FeedPost;
  /** Already formatted, because only the screen knows where the farmer is. */
  distanceLabel?: string;
};

const AVATAR_SIZE = 42;

const UNKNOWN_AUTHOR = 'مزارع من الواحة';

/** A resolved issue has no severity left to report, and the frame drops its badge. */
// The narrowed type is both a MapIssueTier and a SeverityLevel, which is what lets the badge
// take it without the tier table having to know the badge exists.
function badgeTier(tier: MapIssueTier): Exclude<MapIssueTier, 'resolved'> | null {
  return tier === 'resolved' ? null : tier;
}

/** The avatar, author and meta row at the top of a feed card, with the severity badge opposite. */
export function FeedCardHeader({ post, distanceLabel }: FeedCardHeaderProps) {
  const tier = badgeTier(post.tier);
  const tone = tier ? describeTierDisplay(tier) : undefined;

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
        {/* Regular at 14, not bold: the frame gives the name no more weight than the body. */}
        <Text variant="label14" align="right" numberOfLines={1}>
          {post.reporterName || UNKNOWN_AUTHOR}
        </Text>

        <IssueMetaLine
          icons={[Clock, MapPin]}
          labels={[formatRelativeTime(post.createdAt), distanceLabel]}
        />
      </View>

      {tier && tone ? (
        <SeverityBadge
          level={tier}
          label={tone.shortLabel}
          color={tone.color}
          style={styles.badge}
        />
      ) : null}
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
  // Top, not centred: the frame lines the badge up with the author's name, not the meta row.
  badge: {
    alignSelf: 'flex-start',
  },
  // Takes the slack so the badge stays pinned to the leading edge whatever the name's length.
  identity: {
    flex: 1,
    alignItems: 'flex-end',
    gap: spacing[2],
  },
});
