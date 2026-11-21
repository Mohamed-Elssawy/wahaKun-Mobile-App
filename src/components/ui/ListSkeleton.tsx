import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/theme';

import { REPORT_SUMMARY_CARD_HEIGHT } from './ReportSummaryCard';

export type ListSkeletonProps = {
  /** Enough to fill the viewport; more just animates off screen. */
  rows?: number;
  /** Match the real row, or the list jumps when the content arrives. */
  rowHeight?: number;
};

const DEFAULT_ROWS = 4;

/** The summary card is the row most of these lists draw, so it is what the placeholder is. */
const DEFAULT_ROW_HEIGHT = REPORT_SUMMARY_CARD_HEIGHT;

/** §5.3's list skeleton. Static for now: the shimmer needs a reduce-motion decision. */
export function ListSkeleton({
  rows = DEFAULT_ROWS,
  rowHeight = DEFAULT_ROW_HEIGHT,
}: ListSkeletonProps) {
  return (
    // Hidden from screen readers: it says nothing, and announcing it interrupts the real list.
    <View
      style={styles.list}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: rows }, (_, index) => (
        <View key={index} style={[styles.row, { height: rowHeight }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing[16],
  },
  row: {
    borderRadius: radii[12],
    backgroundColor: colors.surfaceMuted,
  },
});
