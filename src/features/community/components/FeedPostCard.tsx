import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { describeTierDisplay } from '@/features/map/tier';
import { isResolvedStatus } from '@/features/reports/status';
import { colors, radii, shadows, spacing } from '@/theme';

import { ConfirmButton } from './ConfirmButton';
import { FeedCardCounters } from './FeedCardCounters';
import { FeedCardHeader } from './FeedCardHeader';
import { FeedCardMedia } from './FeedCardMedia';
import { distanceKm } from '../distance';
import { hasCoordinates } from '../feedQuery';

import type { Coordinates, FeedPost } from '../types';

export type FeedPostCardProps = {
  post: FeedPost;
  /** The farmer's own position. Undefined hides the distance rather than guessing it. */
  origin?: Coordinates | null;
  onPress: (issueId: string) => void;
  onConfirm: (issueId: string) => void;
  onShare: (issueId: string) => void;
};

const CTA = 'عرض تفاصيل المشكلة';
const DESCRIPTION_LINES = 3;

// A 3pt strip in the frame, and the only place a card says how serious it is once resolved
// has taken the badge away.
const STRIP_HEIGHT = 4;

/** Rounded to one decimal, which is what the frame shows: "0.8 كم", "1.8 كم". */
function formatDistance(origin: Coordinates, post: FeedPost): string | undefined {
  if (!hasCoordinates(post)) {
    return undefined;
  }
  return `${distanceKm(origin, post).toFixed(1)} كم`;
}

/** One card on F-01. */
export function FeedPostCard({
  post,
  origin,
  onPress,
  onConfirm,
  onShare,
}: FeedPostCardProps) {
  const { color } = describeTierDisplay(post.tier);
  // A solved problem cannot be confirmed again, so the frame drops the whole row.
  const isResolved = isResolvedStatus(post.status);
  const distanceLabel = origin ? formatDistance(origin, post) : undefined;

  return (
    <View style={styles.card}>
      <View style={[styles.strip, { backgroundColor: colors[color] }]} />

      <View style={styles.body}>
        <FeedCardHeader post={post} distanceLabel={distanceLabel} />

        {/* body14, not body16: the frame's two lines sit 25.5 apart and its glyphs measure
            the same as the name's, so it is 14 with the looser body leading. */}
        {post.description ? (
          <Text variant="body14" align="right" numberOfLines={DESCRIPTION_LINES}>
            {post.description}
          </Text>
        ) : null}

        <FeedCardMedia photoUrl={post.photoUrl} hasVoice={post.hasVoice} />

        {isResolved ? null : (
          <ConfirmButton
            hasConfirmed={post.hasConfirmed}
            confirmations={post.confirmations}
            onPress={() => onConfirm(post.issueId)}
          />
        )}

        <FeedCardCounters
          status={post.status}
          commentCount={post.commentCount}
          shareCount={post.shareCount}
          onOpenComments={() => onPress(post.issueId)}
          onShare={() => onShare(post.issueId)}
        />

        <View style={styles.divider} />

        <Button label={CTA} onPress={() => onPress(post.issueId)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii[16],
    overflow: 'hidden',
    ...shadows.card,
  },
  strip: {
    height: STRIP_HEIGHT,
  },
  body: {
    padding: spacing[16],
    // 8: with a 42 header and two body14 lines that puts the photo 123 below the strip,
    // against the frame's 125.
    gap: spacing[8],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },
});
