import { MessageCircle, Share2 } from 'lucide-react-native';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { Text } from '@/components/ui';
import type { ReportStatus } from '@/features/reports/types';
import { colors, spacing } from '@/theme';

import { StatusPill } from './StatusPill';

export type FeedCardCountersProps = {
  status: ReportStatus;
  commentCount: number;
  shareCount: number;
  onOpenComments: () => void;
  onShare: () => void;
};

const ICON_SIZE = 22;

// The frame's row is 47 tall including its gaps, so the 48dp target comes from hitSlop rather
// than from a minHeight that would push the divider and the CTA down by half a row.
const TOUCH_PADDING = 12;

/**
 * The row under a card's confirm button: status trailing on the right, counters leading on
 * the left.
 */
// The counters cluster runs left to right, unlike everything else here: the frame draws the
// glyph before its number, and a count reads as a number whichever way the page does.
export function FeedCardCounters({
  status,
  commentCount,
  shareCount,
  onOpenComments,
  onShare,
}: FeedCardCountersProps) {
  return (
    <View style={styles.row}>
      <StatusPill status={status} />

      <View style={styles.counters}>
        {/* Opens the issue rather than scrolling in place: the thread lives on F-04. */}
        <TouchableOpacity
          style={styles.counter}
          onPress={onOpenComments}
          hitSlop={TOUCH_PADDING}
          accessibilityRole="button"
          accessibilityLabel={`التعليقات: ${commentCount}`}
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
          accessibilityLabel={`مشاركة البلاغ: ${shareCount}`}
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
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counters: {
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
