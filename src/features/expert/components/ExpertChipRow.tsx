import { ChevronDown } from 'lucide-react-native';

import { FilterChip, FilterChipRow } from '@/components/ui';
import { describeSeverity } from '@/features/reports/severity';
import type { Severity } from '@/features/reports/types';
import { t } from '@/i18n';
import { colors } from '@/theme';

import type { ExpertFilterChip } from '../types';

export type ExpertChipRowProps = {
  filters: readonly ExpertFilterChip[];
  onToggleFilter: (filter: ExpertFilterChip) => void;
};

// Worst first, matching the order §8.3 lists them in.
const SEVERITY_FILTERS: readonly ExpertFilterChip[] = ['critical', 'medium', 'low'];

const CHEVRON_SIZE = 18;

/** The AI severity each severity chip filters on, so the label comes from one place. */
const FILTER_SEVERITY: Record<Exclude<ExpertFilterChip, 'lowConfidence'>, Severity> = {
  critical: 'Critical',
  medium: 'Medium',
  low: 'Low',
};

/** A function, not a table (§16.2): a module-scope Record resolving through t() would evaluate before the splash reads the locale, showing Arabic to an English expert - the only such case an AST sweep found. */
function filterLabel(filter: ExpertFilterChip): string {
  return filter === 'lowConfidence'
    ? t('e01.filterLowConfidence')
    : describeSeverity(FILTER_SEVERITY[filter]).label;
}

/** E-01's chip row. ترتيب draws the chevron but opens nothing: one sort mode is documented. */
export function ExpertChipRow({ filters, onToggleFilter }: ExpertChipRowProps) {
  const sortLabel = t('e01.sortSeverity');

  return (
    <FilterChipRow>
      <FilterChip
        label={sortLabel}
        onPress={() => {}}
        accessibilityLabel={sortLabel}
        trailing={<ChevronDown size={CHEVRON_SIZE} color={colors.textStrong} />}
      />

      <FilterChip
        label={filterLabel('lowConfidence')}
        isActive={filters.includes('lowConfidence')}
        onPress={() => onToggleFilter('lowConfidence')}
      />

      {SEVERITY_FILTERS.map(filter => (
        <FilterChip
          key={filter}
          label={filterLabel(filter)}
          isActive={filters.includes(filter)}
          onPress={() => onToggleFilter(filter)}
        />
      ))}
    </FilterChipRow>
  );
}
