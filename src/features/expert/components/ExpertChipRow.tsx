import { ChevronDown } from 'lucide-react-native';

import { FilterChip, FilterChipRow } from '@/components/ui';
import { describeSeverity } from '@/features/reports/severity';
import { colors } from '@/theme';

import type { ExpertFilterChip } from '../types';

export type ExpertChipRowProps = {
  filters: readonly ExpertFilterChip[];
  onToggleFilter: (filter: ExpertFilterChip) => void;
};

const SORT_LABEL = 'ترتيب: الخطورة';
const LOW_CONFIDENCE_LABEL = 'ثقة منخفضة';

// Worst first, matching the order §8.3 lists them in.
const SEVERITY_FILTERS: readonly ExpertFilterChip[] = ['critical', 'medium', 'low'];

const CHEVRON_SIZE = 18;

const FILTER_LABEL: Record<ExpertFilterChip, string> = {
  lowConfidence: LOW_CONFIDENCE_LABEL,
  critical: describeSeverity('Critical').label,
  medium: describeSeverity('Medium').label,
  low: describeSeverity('Low').label,
};

/**
 * §8.3's E-01 chip row. `ترتيب` draws the chevron the frame shows, but is not a menu: there
 * is exactly one sort mode documented today, so it has nothing to open.
 */
export function ExpertChipRow({ filters, onToggleFilter }: ExpertChipRowProps) {
  return (
    <FilterChipRow>
      <FilterChip
        label={SORT_LABEL}
        onPress={() => {}}
        accessibilityLabel={SORT_LABEL}
        trailing={<ChevronDown size={CHEVRON_SIZE} color={colors.textStrong} />}
      />

      <FilterChip
        label={LOW_CONFIDENCE_LABEL}
        isActive={filters.includes('lowConfidence')}
        onPress={() => onToggleFilter('lowConfidence')}
      />

      {SEVERITY_FILTERS.map(filter => (
        <FilterChip
          key={filter}
          label={FILTER_LABEL[filter]}
          isActive={filters.includes(filter)}
          onPress={() => onToggleFilter(filter)}
        />
      ))}
    </FilterChipRow>
  );
}
