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

/** The row under a card's confirm button: counters leading, status trailing. */
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
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[16],
  },
  counter: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[4],
    // Its own target: the icon alone is 22, well under 48.
    minHeight: 44,
    minWidth: 44,
  },
});
