import { ChevronLeft, Clock } from 'lucide-react-native';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, shadows, spacing } from '@/theme';
import type { ColorToken } from '@/theme';

import { formatReportReference } from '../format';
import { formatRelativeTime } from '../relativeTime';
import { SEVERITY_COLORS } from '../severity';

import type { Report } from '../types';

export type ReportRowProps = {
  report: Report;
  onPress: (reportId: string) => void;
};

const STRIPE_HEIGHT = 3;
const THUMBNAIL_SIZE = 82;
const META_ICON_SIZE = 14;

const UNTITLED = 'بلاغ بدون وصف';

/** Grey until the model has run, since an unanalysed report has no severity to claim. */
function stripeColor(report: Report): ColorToken {
  if (report.status === 'Dismissed') {
    return 'success';
  }
  return report.analysis ? SEVERITY_COLORS[report.analysis.severity] : 'borderStrong';
}

/** One report in the My Issues list. */
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
          <Text variant="label16Bold" align="right" numberOfLines={2}>
            {title}
          </Text>

          <View style={styles.meta}>
            <View style={styles.chip}>
              <Text variant="label12" color="textMuted">
                {formatReportReference(report.id)}
              </Text>
            </View>

            <Clock size={META_ICON_SIZE} color={colors.textMuted} />
            <Text variant="label12" color="textMuted">
              {formatRelativeTime(report.createdAt)}
            </Text>
          </View>
        </View>

        <ChevronLeft size={20} color={colors.textDisabled} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    // The stripe reaches the rounded corners, so the body's padding cannot inset it.
    overflow: 'hidden',
    ...shadows.card,
  },
  stripe: {
    height: STRIPE_HEIGHT,
  },
  body: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceMuted,
  },
  thumbnailEmpty: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    flex: 1,
    gap: spacing.sm,
  },
  meta: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
});
