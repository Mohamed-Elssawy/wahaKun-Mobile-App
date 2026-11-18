import {
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Clock3,
  MessageCircle,
  RotateCcw,
  Share2,
} from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { StatusChip, Text } from '@/components/ui';
import { describeWireStatus } from '@/features/reports/lifecycle';
import type { StatusIconToken } from '@/features/reports/lifecycle';
import type { ReportStatus } from '@/features/reports/types';
import { t } from '@/i18n';
import { colors, spacing } from '@/theme';

import type { LucideIcon } from 'lucide-react-native';

export type FeedCardCountersProps = {
  status: ReportStatus;
  commentCount: number;
  shareCount: number;
  onOpenComments: () => void;
  onShare: () => void;
};

const ICON_SIZE = 22;

// The model names the glyph; this map is the only place a token becomes a lucide component.
const STATUS_ICONS: Record<StatusIconToken, LucideIcon> = {
  alert: CircleAlert,
  clock: Clock3,
  calendar: CalendarClock,
  check: CheckCircle2,
  rotate: RotateCcw,
};

// The frame's row is 47 tall, so the 48dp target comes from hitSlop, not a taller minHeight.
const TOUCH_PADDING = 12;

/** Status trailing, counters leading, and the counters cluster runs left to right. */
export function FeedCardCounters({
  status,
  commentCount,
  shareCount,
  onOpenComments,
  onShare,
}: FeedCardCountersProps) {
  const { label, icon } = describeWireStatus(status);

  return (
    <View style={styles.row}>
      <StatusChip
        icon={STATUS_ICONS[icon]}
        label={label}
        accessibilityLabel={t('f01.statusA11y', { label })}
      />

      <View style={styles.counters}>
        {/* Opens the issue rather than scrolling in place: the thread lives on F-04. */}
        <TouchableOpacity
          style={styles.counter}
          onPress={onOpenComments}
          hitSlop={TOUCH_PADDING}
          accessibilityRole="button"
          accessibilityLabel={t('f01.commentsA11y', { commentCount })}
        >
          <MessageCircle size={ICON_SIZE} color={colors.textSecondary} />
          <Text variant="label16" color="textSecondary">
            {commentCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.counter}
          onPress={onShare}
          hitSlop={TOUCH_PADDING}
          accessibilityRole="button"
          accessibilityLabel={t('f01.sharesA11y', { shareCount })}
        >
          <Share2 size={ICON_SIZE} color={colors.textSecondary} />
          <Text variant="label16" color="textSecondary">
            {shareCount}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // Pinned, not mirrored: F-01 draws icon-then-count left to right in Arabic too, its natural English order.
  counters: {
    direction: 'ltr',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[16],
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
});
