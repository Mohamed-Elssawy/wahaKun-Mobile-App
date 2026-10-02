import { ChevronDown } from 'lucide-react-native';

import { FilterChip, FilterChipRow } from '@/components/ui';
import { describeTierDisplay } from '@/features/map/tier';
import { colors } from '@/theme';

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
 * F-01's chips: a sort menu, then independent filter toggles. The severity chips union rather
 * than replace, so more than one can be on at a time.
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
    <FilterChipRow>
      <FilterChip
        label={`ترتيب: ${SORT_LABELS[sort]}`}
        onPress={onOpenSort}
        accessibilityLabel={`ترتيب البلاغات حسب ${SORT_LABELS[sort]}`}
        trailing={<ChevronDown size={CHEVRON_SIZE} color={colors.textStrong} />}
      />

      <FilterChip label={NEARBY_LABEL} isActive={nearbyOnly} onPress={onToggleNearby} />

      {SEVERITIES.map(severity => (
        <FilterChip
          key={severity}
          label={describeTierDisplay(severity).shortLabel}
          isActive={severities.includes(severity)}
          onPress={() => onToggleSeverity(severity)}
        />
      ))}
    </FilterChipRow>
  );
}
