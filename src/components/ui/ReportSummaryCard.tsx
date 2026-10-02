import { ChevronLeft, Clock } from 'lucide-react-native';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

import { colors, radii, spacing } from '@/theme';
import type { ColorToken } from '@/theme';

import { Text } from './Text';

import type { ReactNode } from 'react';

export type ReportSummaryCardProps = {
  title: string;
  /** The short reference, already formatted: "#1043". */
  reference: string;
  /** Already formatted: "منذ 45 دقيقة". Only the caller knows what it is counting from. */
  timeLabel: string;
  /** The top edge: the severity while it is open, success once it is resolved. */
  borderColor: ColorToken;
  photoUrl?: string;
  /** Supplying it draws the chevron and tightens the gutter it sits in. */
  onPress?: () => void;
  accessibilityLabel?: string;
  /** Hangs under the body: F-07's progress bar and context chip go here. */
  children?: ReactNode;
};

const STRIPE_HEIGHT = 3;
const THUMBNAIL_SIZE = 82;
const META_ICON_SIZE = 12;
const CHEVRON_SIZE = 24;

/** The reference chip is a fixed 64 by 24 in the frame, wider only if the text outgrows it. */
const PILL_WIDTH = 64;
const PILL_HEIGHT = 24;

/** Fixed by the thumbnail, so X-11's sheet can cap its list at a whole number of cards. */
export const REPORT_SUMMARY_CARD_HEIGHT = spacing[12] * 2 + THUMBNAIL_SIZE;

/** The card F-05, F-06 and F-07 all draw. Its top edge is the only thing carrying severity. */
export function ReportSummaryCard({
  title,
  reference,
  timeLabel,
  borderColor,
  photoUrl,
  onPress,
  accessibilityLabel,
  children,
}: ReportSummaryCardProps) {
  const body = (
    <>
      <View style={[styles.stripe, { backgroundColor: colors[borderColor] }]} />

      {/* 8 on the chevron's side, 16 on the photo's: its 24 box carries the other 8 as
          whitespace, so without the chevron the gutter goes back to a full 16. */}
      <View style={[styles.body, onPress ? styles.bodyTappable : styles.bodyPlain]}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailEmpty]} />
        )}

        <View style={styles.text}>
          <Text variant="body14Bold" align="right" numberOfLines={2}>
            {title}
          </Text>

          {/* The reference reads first in Arabic, so it sits at the trailing edge. */}
          <View style={styles.meta}>
            <View style={styles.pill}>
              <Text variant="label12" color="textSecondary">
                {reference}
              </Text>
            </View>

            {/* Clock first, so it sits between the reference and the duration. */}
            <View style={styles.time}>
              <Clock size={META_ICON_SIZE} color={colors.textSecondary} />
              <Text variant="label12" color="textSecondary">
                {timeLabel}
              </Text>
            </View>
          </View>
        </View>

        {onPress ? (
          <ChevronLeft size={CHEVRON_SIZE} color={colors.textSecondary} />
        ) : null}
      </View>

      {children}
    </>
  );

  if (!onPress) {
    return <View style={styles.card}>{body}</View>;
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
    >
      {body}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // No shadow: F-07 goes from white to the canvas in one pixel, with nothing under it.
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii[12],
    // The stripe reaches the rounded corners, so it has to be clipped by them.
    overflow: 'hidden',
  },
  // Over the top padding, not above it: Figma strokes inside the frame, so the card stays 106.
  stripe: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    height: STRIPE_HEIGHT,
  },
  body: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[16],
    paddingVertical: spacing[12],
    paddingRight: spacing[16],
  },
  bodyTappable: {
    paddingLeft: spacing[8],
  },
  bodyPlain: {
    paddingLeft: spacing[16],
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: radii[12],
    backgroundColor: colors.surfaceMuted,
  },
  thumbnailEmpty: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    flex: 1,
    gap: spacing[8],
  },
  meta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[16],
  },
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
});
