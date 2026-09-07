import { ChevronLeft, Clock } from 'lucide-react-native';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';
import { formatReportReference } from '@/features/reports/format';
import { formatRelativeTime } from '@/features/reports/relativeTime';
import { colors, radii, spacing } from '@/theme';

import { describeTierDisplay } from '../tier';

import type { MapIssue } from '../types';

export type MapPeekCardProps = {
  issue: MapIssue;
  /** Set only in X-11's stack, where the card is the way into the issue. */
  onPress?: (issueId: string) => void;
};

const THUMBNAIL = 82;
const STRIPE = 3;
const META_ICON = 12;
const CHEVRON_ICON = 24;

/** The reference chip is a fixed 64 by 24 in the frame, wider only if the text outgrows it. */
const PILL_WIDTH = 64;
const PILL_HEIGHT = 24;

/** Fixed by the thumbnail, so X-11's sheet can cap its list at a whole number of cards. */
export const PEEK_CARD_HEIGHT = spacing[12] * 2 + THUMBNAIL;

/** The card inside F-05's peek sheet. Its top edge carries the severity, nothing else does. */
export function MapPeekCard({ issue, onPress }: MapPeekCardProps) {
  const { color } = describeTierDisplay(issue.tier);

  const body = (
    <>
      <View style={[styles.stripe, { backgroundColor: colors[color] }]} />

      {/* X-11 only: F-05 puts a button under the single card instead. */}
      {onPress ? <ChevronLeft size={CHEVRON_ICON} color={colors.textSecondary} /> : null}

      <View style={styles.text}>
        <Text variant="body14Bold" align="right" numberOfLines={2}>
          {issue.title}
        </Text>

        <View style={styles.meta}>
          <View style={styles.pill}>
            <Text variant="label12" color="textSecondary">
              {formatReportReference(issue.id)}
            </Text>
          </View>

          <View style={styles.time}>
            <Clock size={META_ICON} color={colors.textSecondary} />
            <Text variant="label12" color="textSecondary">
              {formatRelativeTime(issue.createdAt)}
            </Text>
          </View>
        </View>
      </View>

      {issue.photoUrl ? (
        <Image source={{ uri: issue.photoUrl }} style={styles.thumbnail} />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailEmpty]} />
      )}
    </>
  );

  if (!onPress) {
    return <View style={styles.card}>{body}</View>;
  }

  return (
    <TouchableOpacity
      style={[styles.card, styles.tappable]}
      onPress={() => onPress(issue.id)}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={issue.title}
    >
      {body}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Plain row: the frame puts the photo at the trailing edge, with the text to its left.
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[16],
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[16],
    borderRadius: radii[12],
    backgroundColor: colors.surface,
    // The stripe reaches the rounded corners, so it has to be clipped by them.
    overflow: 'hidden',
  },
  // Over the top padding, not above it: Figma strokes inside the frame, so the card stays 106.
  stripe: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    height: STRIPE,
  },
  // The 24 icon box carries 8 of its own whitespace, so 8 here lands the arrow on the text's margin.
  tappable: {
    paddingLeft: spacing[8],
  },
  text: {
    flex: 1,
    gap: spacing[8],
  },
  // The reference reads first in Arabic, so it sits at the trailing edge.
  meta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[16],
  },
  // Clock first, so it sits between the reference and the duration as the frame has it.
  time: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[4],
  },
  // Sized, not padded: no step of the 2pt ramp pads label12's 18 line box out to the frame's 24.
  pill: {
    minWidth: PILL_WIDTH,
    minHeight: PILL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[10],
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceMuted,
  },
  thumbnail: {
    width: THUMBNAIL,
    height: THUMBNAIL,
    borderRadius: radii[12],
    backgroundColor: colors.surfaceMuted,
  },
  thumbnailEmpty: {
    borderWidth: 1,
    borderColor: colors.border,
  },
});
