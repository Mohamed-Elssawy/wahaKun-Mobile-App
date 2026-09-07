import { CalendarClock, CheckCircle2, CircleAlert, Clock3 } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { describeStatusDisplay } from '@/features/reports/status';
import type { ReportStatus } from '@/features/reports/types';
import { colors, radii, spacing } from '@/theme';

import type { LucideIcon } from 'lucide-react-native';

export type StatusPillProps = {
  status: ReportStatus;
};

const ICON_SIZE = 14;

// One glyph per pill, matching the four F-01 draws.
const ICONS: Record<ReportStatus, LucideIcon> = {
  Reported: CircleAlert,
  Diagnosed: Clock3,
  Verified: Clock3,
  Assigned: Clock3,
  Scheduled: CalendarClock,
  Repaired: CheckCircle2,
  Completed: CheckCircle2,
};

/** The outlined pill on a feed card. Outlined, not filled: severity owns the filled one. */
export function StatusPill({ status }: StatusPillProps) {
  const { label, color } = describeStatusDisplay(status);
  const Icon = ICONS[status] ?? CircleAlert;

  return (
    <View
      style={[styles.pill, { borderColor: colors[color] }]}
      accessibilityRole="text"
      accessibilityLabel={`حالة البلاغ: ${label}`}
    >
      <Text variant="label12Bold" color={color}>
        {label}
      </Text>
      <Icon size={ICON_SIZE} color={colors[color]} />
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[4],
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[10],
    paddingVertical: spacing[4],
    borderRadius: radii.pill,
    borderWidth: 1,
  },
});
