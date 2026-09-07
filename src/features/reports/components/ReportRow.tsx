import { ChevronLeft, Clock } from 'lucide-react-native';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';
import type { ColorToken } from '@/theme';

import { formatReportReference } from '../format';
import { formatRelativeTime } from '../relativeTime';
import { describeSeverity } from '../severity';
import { isResolvedStatus } from '../status';

import type { Report } from '../types';

export type ReportRowProps = {
  report: Report;
  onPress: (reportId: string) => void;
};

const STRIPE_HEIGHT = 3;
const THUMBNAIL_SIZE = 82;
const META_ICON_SIZE = 12;
const CHEVRON_SIZE = 24;

/** The reference chip is a fixed 64 by 24 in the frame, wider only if the text outgrows it. */
const PILL_WIDTH = 64;
const PILL_HEIGHT = 24;

const UNTITLED = 'بلاغ بدون وصف';

/** Green once it is fixed, whatever the severity was; grey while there is no analysis. */
function stripeColor(report: Report): ColorToken {
  if (isResolvedStatus(report.status)) {
    return 'success';
  }
  return report.analysis
    ? describeSeverity(report.analysis.severity).color
    : 'borderStrong';
}

/** One report in the My Issues list. F-07 draws the same card F-05's sheet does. */
export function ReportRow({ report, onPress }: ReportRowProps) {
  const title = report.analysis?.problemArabic || report.description || UNTITLED;
  const photo = report.attachments.find(attachment => attachment.type === 'Photo');

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(report.id)}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={[styles.stripe, { backgroundColor: colors[stripeColor(report)] }]} />

      <View style={styles.body}>
        {photo ? (
          <Image source={{ uri: photo.url }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailEmpty]} />
        )}

        <View style={styles.text}>
          <Text variant="body14Bold" align="right" numberOfLines={2}>
            {title}
          </Text>

          <View style={styles.meta}>
            <View style={styles.pill}>
              <Text variant="label12" color="textSecondary">
                {formatReportReference(report.id)}
              </Text>
            </View>

            <View style={styles.time}>
              <Clock size={META_ICON_SIZE} color={colors.textSecondary} />
              <Text variant="label12" color="textSecondary">
                {formatRelativeTime(report.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        <ChevronLeft size={CHEVRON_SIZE} color={colors.textSecondary} />
      </View>
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
  // 8 on the chevron's side, 16 on the photo's: its 24 box carries the other 8 as whitespace.
  body: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[16],
    paddingVertical: spacing[12],
    paddingRight: spacing[16],
    paddingLeft: spacing[8],
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
});
