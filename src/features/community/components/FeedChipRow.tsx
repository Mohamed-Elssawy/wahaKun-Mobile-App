import { ChevronDown } from 'lucide-react-native';
import { ScrollView, StyleSheet } from 'react-native';

import { describeTierDisplay } from '@/features/map/tier';
import { colors, screenPadding, spacing } from '@/theme';

import { FeedChip } from './FeedChip';

import type { FeedSeverity, FeedSort } from '../types';

export type FeedChipRowProps = {
  sort: FeedSort;
  severities: readonly FeedSeverity[];
  nearbyOnly: boolean;
  onOpenSort: () => void;
  onToggleNearby: () => void;
  onToggleSeverity: (severity: FeedSeverity) => void;
};

export const SORT_LABELS: Record<FeedSort, string> = {
  severity: 'الخطورة',
  newest: 'الأحدث',
  nearest: 'الأقرب',
};

const NEARBY_LABEL = 'قريب مني';

// Worst first, which is the order the frame lists them in.
const SEVERITIES: readonly FeedSeverity[] = ['critical', 'medium', 'low'];

const CHEVRON_SIZE = 18;

/**
 * The scrolling pill row under the tabs: a sort menu, then independent filter toggles. The
 * severity chips union rather than replace, so more than one can be on at a time.
 */
export function FeedChipRow({
  sort,
  severities,
  nearbyOnly,
  onOpenSort,
  onToggleNearby,
  onToggleSeverity,
}: FeedChipRowProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      <FeedChip
        label={`ترتيب: ${SORT_LABELS[sort]}`}
        onPress={onOpenSort}
        accessibilityLabel={`ترتيب البلاغات حسب ${SORT_LABELS[sort]}`}
        trailing={<ChevronDown size={CHEVRON_SIZE} color={colors.textStrong} />}
      />

      <FeedChip label={NEARBY_LABEL} isActive={nearbyOnly} onPress={onToggleNearby} />

      {SEVERITIES.map(severity => (
        <FeedChip
          key={severity}
          label={describeTierDisplay(severity).shortLabel}
          isActive={severities.includes(severity)}
          onPress={() => onToggleSeverity(severity)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    // row-reverse plus a right gutter: the sort chip is first and belongs at the right edge.
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing[8],
    paddingHorizontal: screenPadding,
    paddingVertical: spacing[16],
  },
});
