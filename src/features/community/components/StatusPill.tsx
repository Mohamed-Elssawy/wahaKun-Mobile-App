import { CalendarClock, CheckCircle2, CircleAlert, Clock3 } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { describeStatusDisplay } from '@/features/reports/status';
import type { ReportStatus } from '@/features/reports/types';
import { colors, spacing } from '@/theme';

import type { LucideIcon } from 'lucide-react-native';

export type StatusPillProps = {
  status: ReportStatus;
};

const ICON_SIZE = 16;

// One glyph per stage, matching the four F-01 draws.
const ICONS: Record<ReportStatus, LucideIcon> = {
  Reported: CircleAlert,
  Diagnosed: Clock3,
  Verified: Clock3,
  Assigned: Clock3,
  Scheduled: CalendarClock,
  Repaired: CheckCircle2,
  Completed: CheckCircle2,
};

/**
 * The status line on a feed card. No border and no tint in V2, and green whatever the status:
 * the frame samples 1A6B3C on all four, so the glyph is what carries the difference.
 */
export function StatusPill({ status }: StatusPillProps) {
  const { label } = describeStatusDisplay(status);
  const Icon = ICONS[status] ?? CircleAlert;

  return (
    <View
      style={styles.row}
      accessibilityRole="text"
      accessibilityLabel={`حالة البلاغ: ${label}`}
    >
      {/* Leading, so row-reverse puts it to the right of the label as the frame draws it. */}
      <Icon size={ICON_SIZE} color={colors.primary} />

      <Text variant="label14" color="primary">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[8],
  },
});
