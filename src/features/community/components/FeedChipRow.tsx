import { ChevronDown } from 'lucide-react-native';

import { FilterChip, FilterChipRow } from '@/components/ui';
import { describeTierDisplay } from '@/features/map/tier';
import { t } from '@/i18n';
import type { TranslationKey } from '@/i18n';
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

/** Keys, so FeedSortSheet and the chip below resolve them where they render. */
export const SORT_LABEL_KEYS: Record<FeedSort, TranslationKey> = {
  severity: 'f01.sort.severity',
  newest: 'f01.sort.newest',
  nearest: 'f01.sort.nearest',
};

// Worst first, which is the order the frame lists them in.
const SEVERITIES: readonly FeedSeverity[] = ['critical', 'medium', 'low'];

const CHEVRON_SIZE = 18;

/** F-01's chips: a sort menu, then filter toggles that union rather than replace. */
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
        label={t('f01.sortChip', { sortLabels: t(SORT_LABEL_KEYS[sort]) })}
        onPress={onOpenSort}
        accessibilityLabel={t('f01.sortA11y', {
          sortLabels: t(SORT_LABEL_KEYS[sort]),
        })}
        trailing={<ChevronDown size={CHEVRON_SIZE} color={colors.textStrong} />}
      />

      <FilterChip
        label={t('f01.filter.nearMe')}
        isActive={nearbyOnly}
        onPress={onToggleNearby}
      />

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
